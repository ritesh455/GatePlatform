-- Seed Sample Data for Educational Platform

-- Insert sample users (passwords should be hashed in real implementation)
INSERT INTO users (id, name, email, password_hash, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Admin User', 'admin@gate.com', '$2b$10$example_hash_for_password', 'admin'),
('550e8400-e29b-41d4-a716-446655440002', 'Student User', 'student@gate.com', '$2b$10$example_hash_for_password', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert sample study materials
INSERT INTO study_materials (title, subject, content, difficulty) VALUES
('Data Structures - Arrays', 'Computer Science', 'Arrays are fundamental data structures that store elements in contiguous memory locations. They provide O(1) access time for indexed elements and are the foundation for many other data structures.', 'Easy'),
('Operating Systems - Process Management', 'Computer Science', 'Process management involves creating, scheduling, and terminating processes. The OS manages process states, context switching, and ensures efficient CPU utilization.', 'Medium'),
('Database Management - ACID Properties', 'Computer Science', 'ACID properties ensure database transactions are processed reliably. Atomicity, Consistency, Isolation, and Durability are the four key properties that guarantee data integrity.', 'Hard');

-- Insert sample chapters
INSERT INTO chapters (chapter_number, chapter_title) VALUES
(1, 'Data Structures and Algorithms'),
(2, 'Operating Systems'),
(3, 'Database Management Systems')
ON CONFLICT (chapter_number) DO NOTHING;

-- Get chapter IDs for foreign key references
DO $$
DECLARE
    chapter1_id UUID;
    chapter2_id UUID;
    chapter3_id UUID;
BEGIN
    SELECT id INTO chapter1_id FROM chapters WHERE chapter_number = 1;
    SELECT id INTO chapter2_id FROM chapters WHERE chapter_number = 2;
    SELECT id INTO chapter3_id FROM chapters WHERE chapter_number = 3;

    -- Insert sample PDF notes
    INSERT INTO pdf_notes (chapter_id, title, url) VALUES
    (chapter1_id, 'Arrays and Linked Lists', 'https://example.com/arrays-notes.pdf'),
    (chapter2_id, 'Process Management', 'https://example.com/process-management.pdf'),
    (chapter3_id, 'Database Fundamentals', 'https://example.com/database-fundamentals.pdf');

    -- Insert sample video tutorials
    INSERT INTO video_tutorials (chapter_id, title, youtube_url, duration) VALUES
    (chapter1_id, 'Introduction to Data Structures', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '45:30'),
    (chapter2_id, 'OS Fundamentals', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '60:15'),
    (chapter3_id, 'Database Design Principles', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '52:45');
END $$;

-- Insert sample mock test
INSERT INTO mock_tests (title, description, duration) VALUES
('Data Structures Basics', 'Test your knowledge of basic data structures', 30);

-- Get the mock test ID and insert sample questions
DO $$
DECLARE
    test_id UUID;
BEGIN
    SELECT id INTO test_id FROM mock_tests WHERE title = 'Data Structures Basics';

    INSERT INTO questions (mock_test_id, question, options, correct_answer, explanation, subject, difficulty) VALUES
    (test_id, 'What is the time complexity of accessing an element in an array?', 
     '["O(1)", "O(n)", "O(log n)", "O(n²)"]', 0, 
     'Array elements can be accessed directly using their index, resulting in O(1) time complexity.', 
     'Data Structures', 'Easy'),
    (test_id, 'Which data structure uses LIFO principle?', 
     '["Queue", "Stack", "Array", "Linked List"]', 1, 
     'Stack follows Last In First Out (LIFO) principle where the last element added is the first to be removed.', 
     'Data Structures', 'Easy'),
    (test_id, 'What is the worst-case time complexity of binary search?', 
     '["O(1)", "O(log n)", "O(n)", "O(n log n)"]', 1, 
     'Binary search divides the search space in half with each comparison, resulting in O(log n) time complexity.', 
     'Algorithms', 'Medium');
END $$;
