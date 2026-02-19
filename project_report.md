# Final Year Project Report: University Student-to-Student Marketplace

## 1. Introduction
The **University Student-to-Student Marketplace** is a web-based platform designed exclusively for university students to buy and sell products within their campus community. The system ensures trust and security by validating university email addresses and providing a robust moderation system.

## 2. Problem Statement
Existing marketplaces (OLX, Facebook Marketplace) lack verification, leading to trust issues and scams. Students need a closed, secure ecosystem where they can trade academic and dorm essentials with verified peers.

## 3. Objectives
- To provide a secure platform for students to trade.
- To implement real-time communication between buyers and sellers.
- To ensure safety through university email verification and a chat reporting system.

## 4. System Analysis
### 4.1 Functional Requirements
- **User Module**: Registration (University Email), Login, Profile Management.
- **Product Module**: Add, Edit, Delete, View Products.
- **Chat Module**: Real-time messaging, Report Chat.
- **Admin Module**: View Reports, Block Users, Remove Products.

### 4.2 Non-Functional Requirements
- **Security**: JWT Authentication, Password Hashing.
- **Scalability**: Modular MERN stack architecture.
- **Performance**: Optimized React frontend and efficient MongoDB queries.

## 5. System Design
(See `design.md` for ER Diagrams and Architecture)

## 6. Implementation
The project is implemented using the MERN stack:
- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time**: Socket.io

## 7. Testing
- **Unit Testing**: Verified individual API endpoints.
- **Integration Testing**: Verified Chat component integration with Backend.
- **System Testing**: Validated full user flow from Registration to Product Listing and Chat.

## 8. Conclusion
The University Marketplace successfully addresses the need for a secure trading platform for students. Future enhancements could include AI-based price prediction and a mobile application.
