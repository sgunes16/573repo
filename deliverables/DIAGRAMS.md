# The Hive - UML Diagrams

Bu dokümanda The Hive sisteminin tüm UML diyagramları Mermaid.js formatında sunulmaktadır.

## Table of Contents

1. [Class Diagram](#1-class-diagram)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Use Case Diagram](#3-use-case-diagram)
4. [State Diagrams](#4-state-diagrams)
5. [Sequence Diagrams](#5-sequence-diagrams)
6. [Activity Diagrams](#6-activity-diagrams)

---

## 1. Class Diagram

### 1.1 Core Domain Models

```mermaid
classDiagram
    class User {
        +int id
        +string email
        +string password
        +string first_name
        +string last_name
        +bool is_active
        +bool is_verified
        +bool is_admin
        +bool is_superuser
        +bool is_banned
        +bool is_suspended
        +int warning_count
        +datetime created_at
        +datetime updated_at
        +is_authenticated() bool
        +is_anonymous() bool
    }

    class UserProfile {
        +int id
        +string bio
        +string location
        +image avatar
        +json skills
        +float rating
        +string phone_number
        +json badges
        +bool is_onboarded
        +datetime created_at
        +time_credits() int
    }

    class TimeBank {
        +int id
        +int amount
        +int blocked_amount
        +int available_amount
        +int total_amount
        +datetime last_update
        +add_credit(hours)
        +spend_credit(hours) bool
        +block_credit(hours) bool
        +unblock_credit(hours) bool
    }

    class Offer {
        +int id
        +string type
        +string title
        +string description
        +int time_required
        +string location
        +json geo_location
        +string status
        +string activity_type
        +string offer_type
        +int person_count
        +bool provider_paid
        +string location_type
        +json tags
        +json images
        +datetime scheduled_at
        +datetime from_date
        +datetime to_date
        +bool is_flagged
        +string flagged_reason
        +block_time() bool
        +release_time()
    }

    class Exchange {
        +int id
        +string status
        +int time_spent
        +int rating
        +string feedback
        +datetime proposed_at
        +bool requester_confirmed
        +bool provider_confirmed
        +datetime created_at
        +datetime completed_at
    }

    class ExchangeRating {
        +int id
        +int communication
        +int punctuality
        +bool would_recommend
        +string comment
        +datetime created_at
    }

    class TimeBankTransaction {
        +int id
        +int time_amount
        +string transaction_type
        +string description
        +datetime created_at
    }

    User "1" -- "1" UserProfile : has
    User "1" -- "1" TimeBank : has
    User "1" -- "*" Offer : creates
    User "1" -- "*" Exchange : provides
    User "1" -- "*" Exchange : requests
    Offer "1" -- "*" Exchange : has
    Exchange "1" -- "*" ExchangeRating : has
    User "1" -- "*" TimeBankTransaction : sends
    User "1" -- "*" TimeBankTransaction : receives
    Exchange "1" -- "*" TimeBankTransaction : generates
```

### 1.2 Communication & Notification Models

```mermaid
classDiagram
    class Chat {
        +int id
        +string content
        +datetime created_at
    }

    class Message {
        +int id
        +string content
        +datetime created_at
    }

    class Notification {
        +int id
        +string content
        +bool is_read
        +datetime created_at
    }

    class EmailVerificationToken {
        +int id
        +string token
        +datetime created_at
        +datetime expires_at
        +bool is_used
        +is_expired() bool
    }

    User "1" -- "*" Chat : participates
    Chat "1" -- "*" Message : contains
    User "1" -- "*" Message : sends
    User "1" -- "*" Notification : receives
    User "1" -- "*" EmailVerificationToken : has
    Exchange "1" -- "1" Chat : has
```

### 1.3 Moderation & Forum Models

```mermaid
classDiagram
    class Report {
        +int id
        +string target_type
        +int target_id
        +string reason
        +string description
        +string status
        +string admin_notes
        +datetime created_at
    }

    class ForumPost {
        +int id
        +string title
        +string content
        +string category
        +datetime created_at
    }

    class ForumComment {
        +int id
        +string content
        +datetime created_at
    }

    class OfferImage {
        +int id
        +image image
        +string caption
        +bool is_primary
        +datetime created_at
    }

    User "1" -- "*" Report : reports
    User "1" -- "*" Report : is_reported
    User "1" -- "*" Report : resolves
    User "1" -- "*" ForumPost : creates
    ForumPost "1" -- "*" ForumComment : has
    User "1" -- "*" ForumComment : writes
    Offer "1" -- "*" OfferImage : has
```

---

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o| USER_PROFILE : has
    USER ||--o| TIME_BANK : has
    USER ||--o{ OFFER : creates
    USER ||--o{ EXCHANGE : provides
    USER ||--o{ EXCHANGE : requests
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ REPORT : makes
    USER ||--o{ REPORT : receives
    USER ||--o{ FORUM_POST : creates
    USER ||--o{ FORUM_COMMENT : writes
    USER ||--o{ EMAIL_VERIFICATION_TOKEN : has
    
    OFFER ||--o{ EXCHANGE : has
    OFFER ||--o{ OFFER_IMAGE : contains
    
    EXCHANGE ||--o{ EXCHANGE_RATING : has
    EXCHANGE ||--o| CHAT : has
    EXCHANGE ||--o{ TIME_BANK_TRANSACTION : generates
    
    CHAT ||--o{ MESSAGE : contains
    
    FORUM_POST ||--o{ FORUM_COMMENT : has

    USER {
        int id PK
        string email UK
        string password
        string first_name
        string last_name
        bool is_verified
        bool is_admin
        bool is_banned
        int warning_count
    }

    USER_PROFILE {
        int id PK
        int user_id FK
        string bio
        string location
        json skills
        float rating
        bool is_onboarded
    }

    TIME_BANK {
        int id PK
        int user_id FK
        int amount
        int blocked_amount
        int available_amount
        int total_amount
    }

    OFFER {
        int id PK
        int user_id FK
        string type
        string title
        string description
        int time_required
        string status
        string activity_type
        int person_count
    }

    EXCHANGE {
        int id PK
        int offer_id FK
        int provider_id FK
        int requester_id FK
        string status
        int time_spent
        datetime proposed_at
        bool requester_confirmed
        bool provider_confirmed
    }

    EXCHANGE_RATING {
        int id PK
        int exchange_id FK
        int rater_id FK
        int ratee_id FK
        int communication
        int punctuality
        bool would_recommend
    }

    TIME_BANK_TRANSACTION {
        int id PK
        int from_user_id FK
        int to_user_id FK
        int exchange_id FK
        int time_amount
        string transaction_type
    }

    NOTIFICATION {
        int id PK
        int user_id FK
        string content
        bool is_read
    }

    REPORT {
        int id PK
        int reporter_id FK
        int reported_user_id FK
        string target_type
        int target_id
        string reason
        string status
    }

    FORUM_POST {
        int id PK
        int user_id FK
        string title
        string content
        string category
    }

    FORUM_COMMENT {
        int id PK
        int post_id FK
        int user_id FK
        string content
    }
```

---

## 3. Use Case Diagram

### 3.1 User Use Cases

```mermaid
flowchart TB
    subgraph Actors
        U((User))
        VU((Verified User))
        A((Admin))
    end

    subgraph Authentication
        UC1[Register]
        UC2[Login]
        UC3[Verify Email]
        UC4[Reset Password]
        UC5[Complete Onboarding]
    end

    subgraph Profile Management
        UC6[View Profile]
        UC7[Edit Profile]
        UC8[Upload Avatar]
        UC9[Update Skills]
        UC10[View Other Profiles]
    end

    subgraph Offer Management
        UC11[Browse Offers]
        UC12[Search Offers]
        UC13[Filter Offers]
        UC14[View Offer Details]
        UC15[Create Offer]
        UC16[Edit Offer]
        UC17[Delete Offer]
    end

    subgraph Want Management
        UC18[Browse Wants]
        UC19[Create Want]
        UC20[Edit Want]
        UC21[Delete Want]
    end

    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC11
    U --> UC12
    U --> UC13
    U --> UC14
    U --> UC18

    VU --> UC4
    VU --> UC5
    VU --> UC6
    VU --> UC7
    VU --> UC8
    VU --> UC9
    VU --> UC10
    VU --> UC15
    VU --> UC16
    VU --> UC17
    VU --> UC19
    VU --> UC20
    VU --> UC21
```

### 3.2 Exchange Use Cases

```mermaid
flowchart TB
    subgraph Actors
        VU((Verified User))
        P((Provider))
        R((Requester))
    end

    subgraph Exchange Flow
        UC1[Start Handshake]
        UC2[Propose Date/Time]
        UC3[Accept Exchange]
        UC4[Reject Exchange]
        UC5[Cancel Exchange]
        UC6[Confirm Completion]
        UC7[Rate Exchange]
    end

    subgraph Communication
        UC8[Send Chat Message]
        UC9[View Chat History]
    end

    subgraph TimeBank
        UC10[View Balance]
        UC11[View Transactions]
        UC12[Earn Credits]
        UC13[Spend Credits]
    end

    VU --> UC1
    R --> UC2
    R --> UC5
    P --> UC3
    P --> UC4
    VU --> UC6
    VU --> UC7
    VU --> UC8
    VU --> UC9
    VU --> UC10
    VU --> UC11
    P --> UC12
    R --> UC13
```

### 3.3 Admin Use Cases

```mermaid
flowchart TB
    subgraph Actors
        A((Admin))
    end

    subgraph Dashboard
        UC1[View KPIs]
        UC2[View Statistics]
    end

    subgraph Report Management
        UC3[List Reports]
        UC4[View Report Details]
        UC5[Resolve Report]
        UC6[Dismiss Report]
    end

    subgraph User Management
        UC7[Warn User]
        UC8[Ban User]
        UC9[Suspend User]
    end

    subgraph Content Management
        UC10[Delete Offer]
        UC11[Delete Want]
        UC12[Delete Forum Post]
        UC13[Flag Content]
    end

    A --> UC1
    A --> UC2
    A --> UC3
    A --> UC4
    A --> UC5
    A --> UC6
    A --> UC7
    A --> UC8
    A --> UC9
    A --> UC10
    A --> UC11
    A --> UC12
    A --> UC13
```

---

## 4. State Diagrams

### 4.1 Exchange State Diagram

```mermaid
stateDiagram-v2
    [*] --> PENDING : Requester starts handshake

    PENDING --> PENDING : Requester proposes date
    PENDING --> ACCEPTED : Provider accepts
    PENDING --> REJECTED : Provider rejects
    PENDING --> CANCELLED : Requester cancels

    ACCEPTED --> ACCEPTED : Chat messages exchanged
    ACCEPTED --> COMPLETED : Both parties confirm
    ACCEPTED --> CANCELLED : Requester cancels

    REJECTED --> [*]
    CANCELLED --> [*]
    COMPLETED --> [*]

    note right of PENDING
        Credits blocked from requester
    end note

    note right of CANCELLED
        Blocked credits returned
    end note

    note right of COMPLETED
        Credits transferred to provider
        Rating submitted
    end note
```

### 4.2 Offer/Want State Diagram

```mermaid
stateDiagram-v2
    [*] --> ACTIVE : User creates offer/want

    ACTIVE --> ACTIVE : User edits
    ACTIVE --> INACTIVE : User deactivates
    ACTIVE --> COMPLETED : All exchanges completed
    ACTIVE --> CANCELLED : User deletes
    ACTIVE --> FLAGGED : Admin flags

    INACTIVE --> ACTIVE : User reactivates
    INACTIVE --> CANCELLED : User deletes

    FLAGGED --> CANCELLED : Admin removes

    CANCELLED --> [*]
    COMPLETED --> [*]

    note right of ACTIVE
        For wants: credits blocked
    end note

    note right of CANCELLED
        For wants: credits unblocked
    end note
```

### 4.3 Report State Diagram

```mermaid
stateDiagram-v2
    [*] --> PENDING : User submits report

    PENDING --> REVIEWED : Admin views report
    PENDING --> DISMISSED : Admin dismisses

    REVIEWED --> RESOLVED : Admin takes action
    REVIEWED --> DISMISSED : Admin dismisses

    RESOLVED --> [*]
    DISMISSED --> [*]

    note right of RESOLVED
        Actions taken:
        - Content removed
        - User warned
        - User banned
    end note
```

### 4.4 User Account State Diagram

```mermaid
stateDiagram-v2
    [*] --> UNVERIFIED : User registers

    UNVERIFIED --> VERIFIED : Email verified
    UNVERIFIED --> UNVERIFIED : Resend verification

    VERIFIED --> ONBOARDED : Completes onboarding
    VERIFIED --> WARNED : Admin warns

    ONBOARDED --> WARNED : Admin warns
    ONBOARDED --> BANNED : Admin bans

    WARNED --> WARNED : Additional warning
    WARNED --> BANNED : Multiple warnings / severe violation

    BANNED --> [*]

    note right of UNVERIFIED
        Limited access:
        - Cannot create offers
        - Cannot start exchanges
    end note

    note right of BANNED
        Account suspended:
        - Cannot login
        - All exchanges cancelled
    end note
```

---

## 5. Sequence Diagrams

### 5.1 User Registration Flow

```mermaid
sequenceDiagram
    actor U as User
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant E as Email Service

    U->>F: Fill registration form
    F->>B: POST /api/auth/register
    B->>B: Validate password
    B->>B: Hash password
    B->>DB: Create User (is_verified=false)
    DB-->>B: User created
    B->>DB: Create UserProfile
    B->>DB: Create TimeBank (3 credits)
    B->>DB: Create EmailVerificationToken
    B->>E: Send verification email
    E-->>U: Verification email
    B-->>F: Return tokens + user data
    F-->>U: Redirect to verify email page

    U->>E: Click verification link
    E->>F: Open verification page
    F->>B: POST /api/auth/verify-email
    B->>DB: Verify token
    B->>DB: Set is_verified=true
    B-->>F: Verification success
    F-->>U: Redirect to onboarding
```

### 5.2 Complete Exchange Flow (1-to-1)

```mermaid
sequenceDiagram
    actor R as Requester
    actor P as Provider
    participant F as Frontend
    participant B as Backend
    participant WS as WebSocket
    participant DB as Database

    Note over R,DB: Phase 1: Request Exchange
    R->>F: Click "Start Handshake"
    F->>B: POST /api/exchanges/
    B->>DB: Check requester credits
    B->>DB: Block requester credits
    B->>DB: Create Exchange (PENDING)
    B->>WS: Notify provider
    WS-->>P: New exchange request
    B-->>F: Exchange created
    F-->>R: Redirect to handshake page

    Note over R,DB: Phase 2: Propose Date
    R->>F: Select date/time
    F->>B: POST /api/exchanges/{id}/propose-datetime
    B->>DB: Update proposed_at
    B->>WS: Notify provider
    WS-->>P: Date proposed
    B-->>F: Date set

    Note over R,DB: Phase 3: Accept
    P->>F: Click "Accept"
    F->>B: POST /api/exchanges/{id}/accept
    B->>DB: Update status=ACCEPTED
    B->>WS: Notify requester
    WS-->>R: Exchange accepted
    B-->>F: Exchange accepted

    Note over R,DB: Phase 4: Chat & Service
    R->>F: Send message
    F->>WS: Send chat message
    WS->>DB: Save message
    WS-->>P: New message
    
    Note over R,P: Service happens in real world

    Note over R,DB: Phase 5: Completion
    R->>F: Click "Mark Complete"
    F->>B: POST /api/exchanges/{id}/confirm
    B->>DB: Set requester_confirmed=true
    B->>WS: Notify provider
    WS-->>P: Requester confirmed
    B-->>F: Waiting for provider

    P->>F: Click "Mark Complete"
    F->>B: POST /api/exchanges/{id}/confirm
    B->>DB: Set provider_confirmed=true
    B->>DB: Set status=COMPLETED
    B->>DB: Transfer credits (requester → provider)
    B->>DB: Create TimeBankTransaction
    B->>WS: Notify both parties
    B-->>F: Exchange completed

    Note over R,DB: Phase 6: Rating
    R->>F: Submit rating
    F->>B: POST /api/exchanges/{id}/rate
    B->>DB: Create ExchangeRating
    B->>DB: Update provider's average rating
    B-->>F: Rating saved
```

### 5.3 Want Exchange Flow

```mermaid
sequenceDiagram
    actor WO as Want Owner
    actor H as Helper
    participant F as Frontend
    participant B as Backend
    participant DB as Database

    Note over WO,DB: Want Owner creates want
    WO->>F: Create want
    F->>B: POST /api/offers/ (type=want)
    B->>DB: Check owner credits
    B->>DB: Block owner credits
    B->>DB: Create Offer (type=want)
    B-->>F: Want created

    Note over WO,DB: Helper responds to want
    H->>F: Click "Start Handshake" on want
    F->>B: POST /api/exchanges/
    B->>DB: Create Exchange
    Note right of B: Credits already blocked from want owner
    B-->>F: Exchange created

    Note over WO,DB: Want Owner accepts helper
    WO->>F: Accept exchange
    F->>B: POST /api/exchanges/{id}/accept
    B->>DB: Update status=ACCEPTED
    B-->>F: Exchange accepted

    Note over WO,DB: Service & Completion
    Note over WO,H: Service happens
    
    H->>F: Confirm completion
    WO->>F: Confirm completion
    B->>DB: Transfer credits (want owner → helper)
    B-->>F: Exchange completed
```

### 5.4 Report and Admin Resolution Flow

```mermaid
sequenceDiagram
    actor U as Reporter
    actor A as Admin
    participant F as Frontend
    participant B as Backend
    participant DB as Database
    participant WS as WebSocket

    Note over U,DB: User Reports Content
    U->>F: Click "Report"
    F->>F: Show report modal
    U->>F: Select reason & submit
    F->>B: POST /api/reports/
    B->>DB: Create Report (PENDING)
    B->>WS: Notify admins
    B-->>F: Report submitted

    Note over A,DB: Admin Reviews Report
    A->>F: Open Admin Panel
    F->>B: GET /api/admin/reports
    B->>DB: Fetch pending reports
    B-->>F: Return reports list
    A->>F: Click report to view details
    F->>B: GET /api/admin/exchanges/{id}
    B->>DB: Fetch exchange with chat
    B-->>F: Return details

    Note over A,DB: Admin Resolves Report
    A->>F: Select action (remove + ban)
    F->>B: POST /api/admin/reports/{id}/resolve
    B->>DB: Update report status=RESOLVED
    B->>DB: Set user is_banned=true
    B->>DB: Cancel all user's exchanges
    B->>DB: Return blocked credits
    B->>DB: Flag related offers
    B->>WS: Notify affected users
    B-->>F: Report resolved
```

### 5.5 Group Offer Exchange Flow

```mermaid
sequenceDiagram
    actor P as Provider
    actor R1 as Requester 1
    actor R2 as Requester 2
    participant B as Backend
    participant DB as Database

    Note over P,DB: Provider creates group offer
    P->>B: Create offer (activity_type=group, person_count=3)
    B->>DB: Create Offer
    B-->>P: Offer created (3 slots)

    Note over R1,DB: First requester joins
    R1->>B: Start handshake
    B->>DB: Block R1 credits
    B->>DB: Create Exchange #1
    P->>B: Accept
    B->>DB: Update Exchange #1 (ACCEPTED)

    Note over R2,DB: Second requester joins
    R2->>B: Start handshake
    B->>DB: Block R2 credits
    B->>DB: Create Exchange #2
    P->>B: Accept
    B->>DB: Update Exchange #2 (ACCEPTED)

    Note over P,DB: Group event happens
    Note over P,R2: Provider delivers service to all

    Note over R1,DB: Individual completions
    R1->>B: Confirm completion
    P->>B: Confirm R1
    B->>DB: Exchange #1 = COMPLETED
    B->>DB: Transfer R1 credits to P

    R2->>B: Confirm completion
    P->>B: Confirm R2
    B->>DB: Exchange #2 = COMPLETED
    B->>DB: Transfer R2 credits to P

    Note right of P: Provider earned credits from both
```

---

## 6. Activity Diagrams

### 6.1 User Onboarding Activity

```mermaid
flowchart TD
    A([Start]) --> B[User Registers]
    B --> C{Email Verified?}
    C -->|No| D[Send Verification Email]
    D --> E[Wait for Verification]
    E --> C
    C -->|Yes| F[First Login]
    F --> G[Show Onboarding]
    
    G --> H[Step 1: Upload Avatar]
    H --> I{Skip?}
    I -->|Yes| J[Step 2: Set Location]
    I -->|No| H1[Upload Photo]
    H1 --> J
    
    J --> K{Skip?}
    K -->|Yes| L[Step 3: Write Bio]
    K -->|No| J1[Enter Location]
    J1 --> L
    
    L --> M{Skip?}
    M -->|Yes| N[Step 4: Add Skills]
    M -->|No| L1[Write Bio]
    L1 --> N
    
    N --> O{Skip?}
    O -->|Yes| P[Complete Onboarding]
    O -->|No| N1[Select Skills]
    N1 --> P
    
    P --> Q[Set is_onboarded = true]
    Q --> R[Redirect to Dashboard]
    R --> S([End])
```

### 6.2 Exchange Completion Activity

```mermaid
flowchart TD
    A([Exchange Accepted]) --> B[Service Delivered]
    B --> C[Requester Confirms?]
    
    C -->|Yes| D[requester_confirmed = true]
    C -->|No - Cancel| E[Cancel Exchange]
    E --> F[Return Blocked Credits]
    F --> G([Cancelled])
    
    D --> H{Provider Confirmed?}
    H -->|No| I[Wait for Provider]
    I --> J[Provider Confirms?]
    
    J -->|Yes| K[provider_confirmed = true]
    J -->|No| I
    
    H -->|Yes| L[Both Confirmed]
    K --> L
    
    L --> M[Set status = COMPLETED]
    M --> N[Calculate time_spent]
    N --> O[Deduct from Requester TimeBank]
    O --> P[Add to Provider TimeBank]
    P --> Q[Create Transaction Record]
    Q --> R[Prompt for Rating]
    R --> S{Rate?}
    
    S -->|Yes| T[Submit Rating]
    T --> U[Update Provider Average]
    U --> V([Completed])
    
    S -->|Skip| V
```

### 6.3 Credit Flow Activity

```mermaid
flowchart TD
    A([User Registers]) --> B[TimeBank Created]
    B --> C[Initial Balance: 3 Credits]
    
    C --> D{User Action?}
    
    D -->|Request Exchange| E[Check Available Credits]
    E --> F{Sufficient?}
    F -->|No| G[Show Error]
    G --> D
    F -->|Yes| H[Block Credits]
    H --> I[available -= time_required]
    I --> J[blocked += time_required]
    J --> K[Exchange Created]
    
    K --> L{Exchange Outcome?}
    
    L -->|Completed| M[Transfer Credits]
    M --> N[Requester: amount -= time]
    N --> O[Provider: amount += time]
    O --> P[Unblock Requester Credits]
    P --> D
    
    L -->|Cancelled/Rejected| Q[Return Credits]
    Q --> R[blocked -= time]
    R --> S[available += time]
    S --> D
    
    D -->|Provide Service| T[Wait for Completion]
    T --> U[Receive Credits]
    U --> V[amount += earned]
    V --> W[available += earned]
    W --> D
```

### 6.4 Admin Report Handling Activity

```mermaid
flowchart TD
    A([Report Received]) --> B[Status: PENDING]
    B --> C[Admin Views Report]
    C --> D[View Related Content]
    D --> E[View Chat History if Exchange]
    E --> F{Valid Report?}
    
    F -->|No| G[Dismiss Report]
    G --> H[Status: DISMISSED]
    H --> I([End])
    
    F -->|Yes| J{Select Actions}
    
    J --> K{Remove Content?}
    K -->|Yes| L[Delete Offer/Want]
    L --> M[Cancel Related Exchanges]
    M --> N[Return Blocked Credits]
    K -->|No| O{User Action?}
    
    N --> O
    
    O -->|None| P[Resolve Report]
    O -->|Warn| Q[Increment warning_count]
    Q --> R[Send Warning Notification]
    R --> P
    
    O -->|Ban| S[Set is_banned = true]
    S --> T[Cancel All User Exchanges]
    T --> U[Flag All User Offers]
    U --> V[Return All Blocked Credits]
    V --> P
    
    P --> W[Status: RESOLVED]
    W --> X[Add Admin Notes]
    X --> Y[Notify Reporter]
    Y --> I
```

---

## Diagram Usage Notes

### Mermaid.js Rendering

### Diagram Types Summary

| Diagram Type | Purpose |
|--------------|---------|
| **Class Diagram** | Data model structure and relationships |
| **ER Diagram** | Database entity relationships |
| **Use Case Diagram** | Actor interactions with system |
| **State Diagram** | Object lifecycle states |
| **Sequence Diagram** | Interaction flow between components |
| **Activity Diagram** | Process workflow steps |

---

**Document Version:** 1.0  
**Last Updated:** December 2024
