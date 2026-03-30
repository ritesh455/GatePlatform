const { get } = require("http");
const db = require("../config/database");

const getCommunityAccess = async (req, res) => {
  try {

    // userNo from JWT token
    const studentUserNo = req.user.userNo;

    const result = await db.query(
      `SELECT COUNT(*) AS tests_attempted 
       FROM test_results 
       WHERE student_user_no = $1`,
      [studentUserNo]
    );

    const attempts = parseInt(result.rows[0].tests_attempted);

    res.status(200).json({
      success: true,
      student_user_no: studentUserNo,
      tests_attempted: attempts,
      community_access: attempts >= 4
    });

  } catch (error) {

    console.error("Community Access Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};

const findRandomPartner = async (req, res) => {
  try {

    const userNo = req.user.userNo;

    // Get user's average score
    const myScoreResult = await db.query(
      `SELECT AVG(score) AS avg_score 
       FROM test_results 
       WHERE student_user_no = $1`,
      [userNo]
    );

    const myScore = myScoreResult.rows[0].avg_score || 0;

    // Find similar students
    const matchResult = await db.query(
      `SELECT student_user_no
       FROM test_results
       WHERE student_user_no != $1
       GROUP BY student_user_no
       HAVING ABS(AVG(score) - $2) <= 10
       LIMIT 3`,
      [userNo, myScore]
    );

    res.json({
      success: true,
      my_average_score: myScore,
      matched_students: matchResult.rows
    });

  } catch (error) {
    console.error("Matching Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const createStudyGroup = async (req, res) => {
  try {

    const userNo = req.user.userNo;
    const { partnerId } = req.body;

    const groupResult = await db.query(
      `INSERT INTO study_groups (created_by)
       VALUES ($1)
       RETURNING id`,
      [userNo]
    );

    const groupId = groupResult.rows[0].id;

    await db.query(
      `INSERT INTO group_members (group_id, user_no)
       VALUES ($1,$2),($1,$3)`,
      [groupId, userNo, partnerId]
    );

    res.json({
      success: true,
      group_id: groupId
    });

  } catch (error) {
    console.error("Group Creation Error:", error);
    res.status(500).json({ success: false });
  }
};

const createInviteLink = async (req, res) => {

  const groupId = req.body.groupId;

  const inviteCode = Math.random().toString(36).substring(7);

  await db.query(
    `INSERT INTO group_invites (group_id, invite_code)
     VALUES ($1,$2)`,
    [groupId, inviteCode]
  );

  res.json({
    invite_link: `http://localhost:5173/join/${inviteCode}`
  });
};

const sendStudyRequest = async (req, res) => {

  try {

    const sender = req.user.userNo;
    const { receiver } = req.body;

    // 1️⃣ Check if already friends (same group)
    const friendCheck = await db.query(
      `
      SELECT gm1.group_id
      FROM group_members gm1
      JOIN group_members gm2
      ON gm1.group_id = gm2.group_id
      WHERE gm1.user_no = $1
      AND gm2.user_no = $2
      `,
      [sender, receiver]
    );

    if (friendCheck.rows.length > 0) {

      return res.json({
        success: false,
        message: "You are already study partners. Unfriend first to send request again."
      });

    }

    // 2️⃣ Check if request already pending
    const pendingCheck = await db.query(
      `
      SELECT *
      FROM study_requests
      WHERE sender_user_no = $1
      AND receiver_user_no = $2
      AND status = 'pending'
      `,
      [sender, receiver]
    );

    if (pendingCheck.rows.length > 0) {

      return res.json({
        success: false,
        message: "Request already sent"
      });

    }

    // 3️⃣ Insert request
    const result = await db.query(
      `
      INSERT INTO study_requests (sender_user_no, receiver_user_no)
      VALUES ($1,$2)
      RETURNING *
      `,
      [sender, receiver]
    );

    res.json({
      success: true,
      request: result.rows[0]
    });

  } catch (error) {

    console.error("Send request error:", error);

    res.status(500).json({
      success: false
    });

  }

};


const unfriendUser = async (req, res) => {

  try {

    const userNo = req.user.userNo;
    const { roomId } = req.body;

    // verify user is part of group
    const check = await db.query(
      `
      SELECT *
      FROM group_members
      WHERE group_id = $1
      AND user_no = $2
      `,
      [roomId, userNo]
    );

    if (check.rows.length === 0) {

      return res.json({
        success: false,
        message: "You are not part of this group"
      });

    }

    // delete group (cascade deletes messages + members)
    await db.query(
      `
      DELETE FROM study_groups
      WHERE id = $1
      `,
      [roomId]
    );

    res.json({
      success: true,
      message: "Study partner removed successfully"
    });

  } catch (error) {

    console.error("Unfriend error:", error);

    res.status(500).json({
      success: false
    });

  }

};

const getIncomingRequests = async (req, res) => {

  const userNo = req.user.userNo;

  const result = await db.query(
    `SELECT * FROM study_requests
     WHERE receiver_user_no = $1
     AND status = 'pending'`,
    [userNo]
  );

  res.json({
    requests: result.rows
  });

};

const acceptStudyRequest = async (req, res) => {

  const { requestId } = req.body;
  const userNo = req.user.userNo;

  try {

    const reqData = await db.query(
      `SELECT sender_user_no
       FROM study_requests
       WHERE id = $1`,
      [requestId]
    );

    if (reqData.rows.length === 0) {

      return res.status(404).json({
        success: false,
        message: "Request not found"
      });

    }

    const sender = reqData.rows[0].sender_user_no;

    // update request status
    await db.query(
      `UPDATE study_requests
       SET status = 'accepted'
       WHERE id = $1`,
      [requestId]
    );

    // create study group
    const group = await db.query(
      `INSERT INTO study_groups (created_by)
       VALUES ($1)
       RETURNING id`,
      [userNo]
    );

    const groupId = group.rows[0].id;

    // add both members
    await db.query(
      `INSERT INTO group_members (group_id, user_no)
       VALUES ($1,$2),($1,$3)`,
      [groupId, userNo, sender]
    );

    res.json({
      success: true,
      groupId
    });

  } catch (error) {

    console.error("Accept request error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

};

const getMyChats = async (req, res) => {

  try {

    const userNo = req.user.userNo;

    const result = await db.query(
      `
      SELECT 
        sg.id AS room_id,
        s.username
      FROM study_groups sg
      JOIN group_members gm1
        ON sg.id = gm1.group_id
      JOIN group_members gm2
        ON sg.id = gm2.group_id
      JOIN student s
        ON gm2.user_no = s.user_no
      WHERE gm1.user_no = $1
      AND gm2.user_no != $1
      `,
      [userNo]
    );

    res.json({
      success: true,
      chats: result.rows
    });

  } catch (error) {

    console.error("Get chats error:", error);

    res.status(500).json({
      success: false
    });

  }

};
const getChatMessages = async (req, res) => {

  const { roomId } = req.params;

  try {

    const result = await db.query(
      `
      SELECT 
        id,
        sender_user_no,
        message,
        created_at
      FROM group_messages
      WHERE group_id = $1
      ORDER BY created_at ASC
      `,
      [roomId]
    );

    res.json({
      success: true,
      messages: result.rows
    });

  } catch (error) {

    console.error("Message fetch error:", error);

    res.status(500).json({
      success: false
    });

  }

};

const findWeaknessPartner = async (req, res) => {

  try {

    const userNo = req.user.userNo;

    // Step 1: find weakest test title
    const weakResult = await db.query(
      `
      SELECT mt.title, AVG(tr.score) AS avg_score
      FROM test_results tr
      JOIN mock_tests mt ON tr.test_id = mt.id
      WHERE tr.student_user_no = $1
      GROUP BY mt.title
      ORDER BY avg_score ASC
      LIMIT 1
      `,
      [userNo]
    );

    if (weakResult.rows.length === 0) {

      return res.json({
        success: false,
        message: "Not enough test data"
      });

    }

    const weakTitle = weakResult.rows[0].title;

    // Step 2: find other students with same test
    const matchResult = await db.query(
      `
      SELECT tr.student_user_no
      FROM test_results tr
      JOIN mock_tests mt ON tr.test_id = mt.id
      WHERE mt.title = $1
      AND tr.student_user_no != $2
      GROUP BY tr.student_user_no
      LIMIT 5
      `,
      [weakTitle, userNo]
    );

    if (matchResult.rows.length === 0) {

      return res.json({
        success: false,
        message: "No study partners found"
      });

    }

    res.json({
      success: true,
      weakTitle,
      matches: matchResult.rows
    });

  } catch (error) {

    console.error("Weakness matching error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

};

const leaveChat = async (req, res) => {

  const { roomId } = req.body;
  const userNo = req.user.userNo;

  try {

    await db.query(
      `
      DELETE FROM group_members
      WHERE group_id = $1
      AND user_no = $2
      `,
      [roomId, userNo]
    );

    res.json({
      success: true
    });

  } catch (error) {

    console.error("Leave chat error:", error);

    res.status(500).json({
      success: false
    });

  }

};

module.exports = {
  getCommunityAccess,
  findRandomPartner,
  createStudyGroup,
    createInviteLink,
    sendStudyRequest,
    getIncomingRequests,
    acceptStudyRequest,
    getMyChats,
    getChatMessages,
    findWeaknessPartner,
    unfriendUser,
    leaveChat
};