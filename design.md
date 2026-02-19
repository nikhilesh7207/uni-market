# System Design & Architecture

## ER Diagram (Entity-Relationship)

```mermaid
erDiagram
    USER ||--o{ PRODUCT : "lists"
    USER ||--o{ CHAT : "participates in"
    USER ||--o{ MESSAGE : "sends"
    PRODUCT ||--o{ CHAT : "has"
    
    USER {
        ObjectId _id
        String name
        String email
        String password
        String role
        String profilePic
        Date createdAt
    }

    PRODUCT {
        ObjectId _id
        String name
        String description
        String category
        Number price
        String[] images
        ObjectId seller
        Date createdAt
    }

    CHAT {
        ObjectId _id
        ObjectId product
        ObjectId[] participants
        Boolean isReported
        String reportReason
        ObjectId reportedBy
        Date createdAt
    }

    MESSAGE {
        ObjectId sender
        String content
        Date timestamp
    }
```

## System Architecture

The system follows a 3-tier architecture:
1. **Client Layer (Frontend)**: React + Vite application handling UI and user interactions.
2. **Server Layer (Backend)**: Node.js + Express API handling business logic, authentication, and socket connections.
3. **Data Layer (Database)**: MongoDB storing users, products, and chat history.

Additional **AI Service** runs independently to provide recommendations and moderation support.
