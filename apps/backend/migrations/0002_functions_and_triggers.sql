-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating timestamps on users table
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger for updating timestamps on game_sessions table
CREATE TRIGGER update_game_sessions_timestamp
BEFORE UPDATE ON game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Function to generate a random referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER := 0;
  rand_int INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    rand_int := floor(random() * length(chars) + 1)::INTEGER;
    result := result || substr(chars, rand_int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to set a random referral code for new users
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  code_exists BOOLEAN;
  new_code TEXT;
  attempts INTEGER := 0;
  max_attempts INTEGER := 10;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      new_code := generate_referral_code();
      SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists OR attempts >= max_attempts;
      attempts := attempts + 1;
    END LOOP;
    
    IF attempts >= max_attempts THEN
      RAISE EXCEPTION 'Failed to generate a unique referral code after % attempts', max_attempts;
    END IF;
    
    NEW.referral_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set referral code on user creation
CREATE TRIGGER set_user_referral_code
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION set_referral_code();

-- Function to update user token balance
CREATE OR REPLACE FUNCTION update_user_tokens(
  p_user_id UUID,
  p_amount BIGINT
)
RETURNS BIGINT AS $$
DECLARE
  new_balance BIGINT;
BEGIN
  -- Update the user's token balance
  UPDATE users
  SET token_balance = token_balance + p_amount
  WHERE id = p_user_id
  RETURNING token_balance INTO new_balance;
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to claim daily bonus
CREATE OR REPLACE FUNCTION claim_daily_bonus(
  p_user_id UUID
)
RETURNS TABLE(amount BIGINT, streak_days INTEGER) AS $$
DECLARE
  last_claim_date TIMESTAMP WITH TIME ZONE;
  current_streak_days INTEGER;
  bonus_amount BIGINT;
  next_day_number INTEGER;
BEGIN
  -- Get the last claim date and current streak
  SELECT 
    MAX(claimed_at),
    MAX(day_number)
  INTO last_claim_date, current_streak_days
  FROM daily_rewards
  WHERE user_id = p_user_id;
  
  -- If no previous claims, start with day 1
  IF last_claim_date IS NULL THEN
    next_day_number := 1;
    current_streak_days := 0;
  ELSE
    -- Check if the last claim was yesterday (or earlier)
    IF last_claim_date < (CURRENT_DATE - INTERVAL '1 day') THEN
      -- Streak broken, start over from day 1
      next_day_number := 1;
      current_streak_days := 0;
    ELSIF last_claim_date::date = CURRENT_DATE THEN
      -- Already claimed today
      RAISE EXCEPTION 'Daily bonus already claimed today';
    ELSE
      -- Continue the streak
      next_day_number := current_streak_days + 1;
      IF next_day_number > 7 THEN
        next_day_number := 1; -- Reset to day 1 after 7 days
      END IF;
    END IF;
  END IF;
  
  -- Calculate bonus amount (example: 100 tokens * day number)
  bonus_amount := 100 * next_day_number;
  
  -- Record the claim
  INSERT INTO daily_rewards (user_id, day_number, reward_amount)
  VALUES (p_user_id, next_day_number, bonus_amount);
  
  -- Return the result
  RETURN QUERY 
  SELECT bonus_amount, next_day_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_game_type TEXT,
  p_timeframe TEXT,
  p_metric TEXT,
  p_limit INTEGER,
  p_offset INTEGER
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  score BIGINT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    WITH ranked_users AS (
      SELECT 
        u.id AS user_id,
        u.username,
        u.avatar_url,
        %s AS score,
        ROW_NUMBER() OVER (ORDER BY %s DESC) AS rank
      FROM users u
      %s
      GROUP BY u.id
      ORDER BY score DESC
      LIMIT %s OFFSET %s
    )
    SELECT user_id, username, avatar_url, score, rank
    FROM ranked_users
    ORDER BY rank
  ',
  -- Dynamic column for score based on metric
  CASE 
    WHEN p_metric = 'tokens_earned' THEN 'COALESCE(SUM(tt.amount), 0)'
    WHEN p_metric = 'games_played' THEN 'COUNT(gs.id)'
    WHEN p_metric = 'win_rate' THEN 'ROUND(100.0 * SUM(CASE WHEN gs.result = ''win'' THEN 1 ELSE 0 END) / NULLIF(COUNT(gs.id), 0), 2)'
    WHEN p_metric = 'biggest_win' THEN 'COALESCE(MAX(gs.win_amount), 0)'
    ELSE '0' -- Default to 0 for unknown metrics
  END,
  
  -- Order by the same expression as the score
  CASE 
    WHEN p_metric = 'tokens_earned' THEN 'COALESCE(SUM(tt.amount), 0)'
    WHEN p_metric = 'games_played' THEN 'COUNT(gs.id)'
    WHEN p_metric = 'win_rate' THEN 'ROUND(100.0 * SUM(CASE WHEN gs.result = ''win'' THEN 1 ELSE 0 END) / NULLIF(COUNT(gs.id), 0), 2)'
    WHEN p_metric = 'biggest_win' THEN 'COALESCE(MAX(gs.win_amount), 0)'
    ELSE '0' -- Default to 0 for unknown metrics
  END,
  
  -- Join with game_sessions if needed
  CASE 
    WHEN p_metric IN ('games_played', 'win_rate', 'biggest_win') THEN 
      CASE 
        WHEN p_game_type = 'all' THEN 'LEFT JOIN game_sessions gs ON u.id = gs.user_id'
        ELSE 'LEFT JOIN game_sessions gs ON u.id = gs.user_id AND gs.game_type = ' || quote_literal(p_game_type)
      END
    WHEN p_metric = 'tokens_earned' THEN 
      'LEFT JOIN token_transactions tt ON u.id = tt.user_id AND tt.amount > 0'
    ELSE ''
  END,
  
  -- Limit and offset
  p_limit,
  p_offset
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get user rank
CREATE OR REPLACE FUNCTION get_user_rank(
  p_user_id UUID,
  p_game_type TEXT,
  p_timeframe TEXT,
  p_metric TEXT
)
RETURNS TABLE(
  rank BIGINT,
  total_players BIGINT
) AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    WITH ranked_users AS (
      SELECT 
        u.id,
        %s AS score,
        ROW_NUMBER() OVER (ORDER BY %s DESC) AS rank
      FROM users u
      %s
      GROUP BY u.id
    ),
    total AS (
      SELECT COUNT(*) AS count FROM ranked_users
    )
    SELECT ru.rank, t.count
    FROM ranked_users ru, total t
    WHERE ru.id = %L
  ',
  -- Same expressions as in get_leaderboard
  CASE 
    WHEN p_metric = 'tokens_earned' THEN 'COALESCE(SUM(tt.amount), 0)'
    WHEN p_metric = 'games_played' THEN 'COUNT(gs.id)'
    WHEN p_metric = 'win_rate' THEN 'ROUND(100.0 * SUM(CASE WHEN gs.result = ''win'' THEN 1 ELSE 0 END) / NULLIF(COUNT(gs.id), 0), 2)'
    WHEN p_metric = 'biggest_win' THEN 'COALESCE(MAX(gs.win_amount), 0)'
    ELSE '0'
  END,
  
  CASE 
    WHEN p_metric = 'tokens_earned' THEN 'COALESCE(SUM(tt.amount), 0)'
    WHEN p_metric = 'games_played' THEN 'COUNT(gs.id)'
    WHEN p_metric = 'win_rate' THEN 'ROUND(100.0 * SUM(CASE WHEN gs.result = ''win'' THEN 1 ELSE 0 END) / NULLIF(COUNT(gs.id), 0), 2)'
    WHEN p_metric = 'biggest_win' THEN 'COALESCE(MAX(gs.win_amount), 0)'
    ELSE '0'
  END,
  
  CASE 
    WHEN p_metric IN ('games_played', 'win_rate', 'biggest_win') THEN 
      CASE 
        WHEN p_game_type = 'all' THEN 'LEFT JOIN game_sessions gs ON u.id = gs.user_id'
        ELSE 'LEFT JOIN game_sessions gs ON u.id = gs.user_id AND gs.game_type = ' || quote_literal(p_game_type)
      END
    WHEN p_metric = 'tokens_earned' THEN 
      'LEFT JOIN token_transactions tt ON u.id = tt.user_id AND tt.amount > 0'
    ELSE ''
  END,
  
  -- User ID parameter
  p_user_id
  );
END;
$$ LANGUAGE plpgsql;
