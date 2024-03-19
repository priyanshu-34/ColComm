const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const axios = require("axios");



const sendMessage = asyncHandler(async (req, res) => {
  const content = req.body.content;
  const chatId = req.body.chatId;
  const imageFile = req.files[0]; // Assuming only one file is uploaded
 

  if ((!content && !imageFile) || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  try {
    const flaskApiEndpoint =
      "https://monthly-caring-bear.ngrok-free.app/predictSentiment";
    const modelResponse = await axios.post(flaskApiEndpoint, {
      text: content,
    });

    const label = modelResponse.data[0].label;
    if (label === "negative") {
      throw new Error("Hateful or Abusive Text");
    }
  } catch (error) {
    console.error(error.message);
    return res.status(400).json({ error: error.message });
  }

  // Create a new message object
  const newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };
  
  // If an image file is uploaded, add image data to the message object
  if (imageFile) {
        newMessage.imageName = imageFile.filename;
  }
  console.log(newMessage);

  try {
    var message = await Message.create(newMessage);
    console.log(message);
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });
    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });
    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});




const allMessages = asyncHandler(async (req, res) => {
  try {
    const message = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { sendMessage, allMessages };
