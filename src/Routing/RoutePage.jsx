import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../user-pages/Home";
import Chat from "../user-pages/Chat";
import Register from "../admin-pages/Register";
import RegisterUser from "../user-pages/RegisterUser";
import UserContactList from "../user-pages/UserContactList";
import TutorLogin from "../admin-pages/TutorLogin";
import Login from "../user-pages/Login";
import AdminContactList from "../admin-pages/AdminContactList";
import AdminChat from "../admin-pages/AdminChat";
import Dash from "../user-pages/Dash";

function RoutePage() {
  return (
    <>
      <BrowserRouter>
        <Routes>
        {/* ADMIN */}
          <Route path="/Tlogin" element={<TutorLogin />} />
          <Route path="/registerTutor" element={<Register />} />
          <Route path="/adminMsgList" element={<AdminContactList />} />
          <Route path="/admin/chat/:email" element={<AdminChat />} />
       



         {/* Users  */}

          <Route path="/" element={<Home />} />
         <Route path="/chat/:email" element={<Chat />} />
         <Route path="/register" element={<RegisterUser />} />
         <Route path="/msgList" element={<UserContactList />} />
         <Route path="/login" element={<Login />} />
         <Route path="/dash" element={<Dash />} />
        
        


        </Routes>
      </BrowserRouter>
    </>
  );
}

export default RoutePage;
