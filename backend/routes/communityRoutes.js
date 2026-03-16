const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/auth");

const {
  getCommunityAccess, findRandomPartner, createStudyGroup, createInviteLink, sendStudyRequest, getIncomingRequests, acceptStudyRequest
  , getMyChats, leaveChat, getChatMessages,findWeaknessPartner,unfriendUser,
} = require("../controllers/communityController");

router.get(
  "/community-access",
  authenticateToken,
  getCommunityAccess
);

router.get(
  "/find-random-partner",
  authenticateToken,
  findRandomPartner
);

router.get(
 "/incoming-requests",
 authenticateToken,
 getIncomingRequests
);

router.get(
 "/my-chats",
 authenticateToken,
 getMyChats
);

router.get(
 "/chat/:roomId/messages",
 authenticateToken,
 getChatMessages
);

router.get(
  "/find-weakness-partner",
  authenticateToken,
  findWeaknessPartner
);

router.post(
 "/unfriend",
 authenticateToken,
 unfriendUser
);

router.post(
 "/leave-chat",
 authenticateToken,
 leaveChat
);

router.post(
  "/create-group",
  authenticateToken,
  createStudyGroup
);

router.post(
  "/invite-link",
  authenticateToken,
  createInviteLink
);

router.post(
 "/send-study-request",
 authenticateToken,
 sendStudyRequest
);

router.post(
 "/accept-request",
 authenticateToken,
 acceptStudyRequest
);



module.exports = router;