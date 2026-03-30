const API = "https://gateplatform.onrender.com/api/community";

export const getCommunityAccess = async (token: string) => {

  const res = await fetch(`${API}/community-access`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return res.json();
};

export const findRandomPartner = async (token: string) => {

  const res = await fetch("https://gateplatform.onrender.com/api/community/find-random-partner", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  return res.json();
};

export const sendStudyRequest = async (token: string, receiver: number) => {
  try {
    const res = await fetch(
      "https://gateplatform.onrender.com/api/community/send-study-request",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ receiver })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.message || "Request failed");
    }

    return data;
  } catch (error) {
    console.error("Send request error:", error);
    throw error;
  }
};

export const getIncomingRequests = async (token: string) => {

  const res = await fetch(
    "https://gateplatform.onrender.com/api/community/incoming-requests",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.json();
};

export const acceptStudyRequest = async (
  token: string,
  requestId: number
) => {

  const res = await fetch(
    "https://gateplatform.onrender.com/api/community/accept-request",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ requestId })
    }
  );

  return res.json();
};

export const getMyChats = async (token: string) => {

  const res = await fetch(
    "https://gateplatform.onrender.com/api/community/my-chats",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.json();
};


export const getChatMessages = async (
  token: string,
  roomId: number
) => {

  const res = await fetch(
    `https://gateplatform.onrender.com/api/community/chat/${roomId}/messages`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.json();
};


export const unfriend = async (
  token: string,
  roomId: number
) => {

  const res = await fetch(
    "https://gateplatform.onrender.com/api/community/unfriend",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ roomId })
    }
  );

  return res.json();

};

export const leaveChat = async (
  token: string,
  roomId: number
) => {

  const res = await fetch(
    "https://gateplatform.onrender.com/api/community/leave-chat",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ roomId })
    }
  );

  return res.json();
};