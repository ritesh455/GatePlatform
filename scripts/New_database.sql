-- ===============================================
-- ENUMS
-- ===============================================

-- Enum for admin request status
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');
ALTER TYPE request_status ADD VALUE 'blocked';

-- Enum for user role
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- (Optional) You can also make gender and branch enums if you want stricter values later.


-- ===============================================
-- USERS TABLE (Students)
-- ===============================================

CREATE TABLE users (
  id             BIGSERIAL PRIMARY KEY,         -- auto-increment primary key
  user_no        BIGSERIAL UNIQUE,              -- second auto-increment (unique)
  username       VARCHAR(150) NOT NULL UNIQUE,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,         -- store hashed passwords
  role           user_role DEFAULT 'student' NOT NULL,  -- role field (fixed as 'student')
  branch         VARCHAR(50),                   -- CSE, DS, Civil, EE, ENTC
  gender         VARCHAR(20),                   -- male, female, other
  city           VARCHAR(100),
  state          VARCHAR(100),
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Optional index for lookups by branch or role
CREATE INDEX idx_users_branch ON users(branch);
CREATE INDEX idx_users_role ON users(role);


-- ===============================================
-- ADMINS TABLE
-- ===============================================

CREATE TABLE admins (
  id              BIGSERIAL PRIMARY KEY,         -- auto-increment primary key
  admin_no        BIGSERIAL UNIQUE,              -- second auto-increment (unique)
  username        VARCHAR(150) NOT NULL UNIQUE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  role            user_role DEFAULT 'admin' NOT NULL,  -- role field (fixed as 'admin')
  phone           VARCHAR(30),
  degree_file     BYTEA,                         -- for file upload storage (can change to TEXT path)
  request_status  request_status DEFAULT 'pending' NOT NULL, -- pending / accepted / rejected
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_admins_request_status ON admins(request_status);
CREATE INDEX idx_admins_role ON admins(role);



CREATE TABLE admins (
    id              BIGSERIAL PRIMARY KEY,      -- auto-increment primary key
    admin_no        BIGSERIAL UNIQUE,           -- second auto-increment (unique)
    username        VARCHAR(150) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role DEFAULT 'admin' NOT NULL,
    phone           VARCHAR(30),
    branch          VARCHAR(50),                -- <--- THE NEW FIELD
    degree_file     TEXT,                       -- Storing file path (TEXT) is better than BYTEA
    request_status  request_status DEFAULT 'pending' NOT NULL, -- pending / accepted / rejected
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);








NEW script of systemadmin

CREATE TABLE systemadmin (
    admin_id        BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    email           VARCHAR(255) UNIQUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login      TIMESTAMP WITH TIME ZONE
);


INSERT INTO systemadmin (username, password_hash, email)
VALUES (
    'system-admin',
    crypt('system123', gen_salt('bf')), 
    'admin@example.com'
);

select * from systemadmin;

ALTER TYPE request_status ADD VALUE 'blocked';

select * from admins;

select * from student;





Test Results

CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
    -- New foreign key referencing the student's unique user_no (BIGINT)
    student_user_no BIGINT NOT NULL REFERENCES student(user_no) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken INTEGER NOT NULL, -- in minutes
    answers JSONB NOT NULL, -- Array of selected answers stored as JSON
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);