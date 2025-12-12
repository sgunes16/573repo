# Software Requirements Specification (SRS)

**Project Title:** The Hive: A Community-Oriented Service Offering Platform

**Version:** v.0.1

**Date:** 03.11.25

**Authors:** @sgunes16

---

## 1. Introduction

### 1.1 Purpose

This SRS document has been prepared to define the requirements of the Hive project and to ensure agreement on these requirements between the developer and the project owner before starting the design and implementation phases.

### 1.2 Scope

Hive is a non-profit project designed for a community where users can submit offers and wants. A website will be developed to enable users to perform these activities.

### 1.3 Definitions, Acronyms, and Abbreviations

- Hive: A community-oriented service offering platform
- User: A person who uses the Hive platform
- Offer: A service that a user is offering
- Want: A service that a user is wanting
- TimeBank: A system that allows users to exchange services where all contributions are valued equally in terms of time
- Admin: A user with access to manage users, offers, wants, and overall platform content and settings
- Handshake: A process where two users agree to exchange services
- Rating: A rating given by a user to another user
- Transaction: A record of a service exchange between two users
- Profile: A user's profile information
- TimeBankTransaction: A record of a time bank transaction

### 1.4 References

- [Django Documentation](https://docs.djangoproject.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Chakra UI Documentation](https://chakra-ui.com/docs)

### 1.5 Overview

Hive is a platform that allows users to share and request various services within a community, prioritizing collaboration and mutual support. The system enables users to see and interact with available offers and wants, making exchange straightforward.

The platform is centered around a TimeBank system, enabling users to exchange services where all contributions are valued equally in terms of time. Additionally, it offers basic administrative and community features to encourage participation, support, and interaction among members.

The platform will be accessible from any web browser and can be used on both desktop and mobile devices. The backend will operate on a cloud-based Linux server, and no additional software installation will be required for users.

The system will be built using Django and PostgreSQL.


---

## 2. Overall Description

### 2.1 Product Perspective

The product is required to be standalone. After project completion, product owners should be able to manage the project without needing any additional software.

### 2.2 Product Functions

Hive is a platform that allows users to share and request various services within a community, prioritizing collaboration and mutual support. The system enables users to see and interact with available offers and wants, making exchange straightforward.

The platform is centered around a TimeBank system, enabling users to exchange services where all contributions are valued equally in terms of time. Additionally, it offers basic administrative and community features to encourage participation, support, and interaction among members.

### 2.3 User Classes and Characteristics

| User Role       | Description                                                                                                                                                           | Technical Expertise                       | Typical Goals                                                                            |
|-----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|------------------------------------------------------------------------------------------|
| Anonymous User  | A visitor who has not registered or logged into the system. Can only browse public offers and wants.                                                                  | None                                      | Browse the platform, view public offers/wants                                            |
| Registered User | A user who has signed up and logged into the system. Can create, edit, and delete their own offers/wants, view others' offers/wants, and interact with the community. | Basic computer literacy                   | Add offers/wants, participate in exchanges, manage own profile                           |
| Admin           | A user with access to manage users, offers, wants, and overall platform content and settings. Can resolve disputes and moderate community participation.              | Intermediate to advanced technical skills | Moderate the community, manage users and content, ensure smooth operation and compliance |

### 2.4 Operating Environment

The platform will be accessible from any web browser and can be used on both desktop and mobile devices. The backend will operate on a cloud-based Linux server, and no additional software installation will be required for users.

### 2.5 Constraints

#### 2.5.1 Technical

- The backend will be built using Django and PostgreSQL.
- The application must support the latest two versions of major web browsers (Chrome, Firefox, Edge, Safari).
- All communications between client and server must use HTTPS.
- The system must be able to scale horizontally as user demand grows.
- Maximum file upload size will be limited to 10MB per file.
- Sensitive data (such as passwords) must be stored securely (encrypted or hashed, following best practices).

#### 2.5.2 Legal

- The platform must protect user privacy and follow laws like GDPR if needed.
- User information cannot be shared without their clear permission, unless the law says so.
- Users should be able to see, change, or delete their personal data if they ask.
- The system must show a simple privacy policy and ask users before collecting their information.

#### 2.5.3 Operational

- The system should have 99% or higher uptime, except during scheduled maintenance.
- Maintenance tasks like database backups and updates should be done during low-traffic times to avoid disturbing users.
- Admin actions like banning users, moderating content, or posting important announcements should be possible without needing to take the system offline.
- The platform should not depend on any service or tool that the project owners can't manage or replace after delivery.
- Regular backups of all data should be made and kept safe so that information can be restored if needed.
- There should be an easy way for users to report issues and get support when needed.


### 2.6 Assumptions and Dependencies

List assumptions that could affect the requirements.

- The system assumes users have access to an internet connection and a modern web browser.
- It is assumed that admins will be assigned and identifiable by a flag or role in the user model.
- User-generated content (such as offer descriptions, profile photos) is expected to comply with community guidelines; moderation will be the responsibility of platform admins.
- If integration with email or notification services is required, it is assumed that necessary credentials and configuration access will be available.
- Users are responsible for the accuracy of the data they enter; the system will provide validation and basic error checking.
- Any optional integrations with external services (e.g., social login) assume those services remain available and their terms of use do not conflict with project goals.

---

## 3. System Features and Requirements


### 3.1.1 Feature 1.1 – Create Offer

#### 3.1.1.1 Description

This feature allows registered users to create and publish offers. Users can add a title, description, tags, and optionally upload images. The system stores offers for retrieval, editing, and display on the public feed.

#### 3.1.1.2 User Story

> As a _registered user_, I want to _create a offer with a title, description, and tags_ so that _I can share my offer with other users on the platform_.

#### 3.1.1.3 Acceptance Criteria

- Given a registered user, when they submit a new offer with a title and description, then the offer is saved in the system and appears on the public feed.

- Given missing required fields (title or description), the system shall display an error message and prevent submission.

- Users shall be able to edit or delete their own offers after creation.

- Offers shall include timestamps for creation and last modification.

- The system shall prevent unauthorized users from creating or editing offers.

#### 3.1.1.4 Functional Requirements

| ID   | Requirement                                                                                                    | Priority | Notes |
|------|----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-1 | A registered user shall be able to create a new offer with a title and description.                            | High     |       |
| FR-2 | A registered user shall be able to optionally add tags to an offer.                                            | Medium   |       |
| FR-3 | A registered user shall be able to upload images associated with the offer.                                    | Medium   |       |
| FR-4 | The system shall save offers and display them in the public feed.                                              | High     |       |
| FR-5 | Users shall only be able to edit or delete their own offers.                                                   | High     |       |
| FR-6 | The system shall validate that required fields are not empty before submission.                                | High     |       |
| FR-6a | The system shall prevent editing of offers with PENDING, ACCEPTED, or COMPLETED exchanges.                    | High     |       |
| FR-6b | The system shall display edit lock status to the user when an offer cannot be edited.                         | Medium   |       |

#### 3.1.1.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Offers shall be saved and displayed in the feed within 2 seconds under normal load.                                    | High      |
| Security        | Only authenticated users shall be able to create, edit, or delete offers.                                              | High      |
| Usability       | The create-offer form shall be responsive and accessible on desktop and mobile devices.                                | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.2 Feature 1.2 - Create Want

#### 3.1.2.1 Description

This feature allows registered users to create and publish wants. Users can add a title, description, tags, and optionally upload images. The system stores wants for retrieval, editing, and display on the public feed.

#### 3.1.2.2 User Story

> As a _registered user_, I want to _create a want with a title, description, and tags_ so that _I can share my want with other users on the platform_.

#### 3.1.2.3 Acceptance Criteria

- Given a registered user, when they submit a new want with a title and description, then the want is saved in the system and appears on the public feed.

- Given missing required fields (title or description), the system shall display an error message and prevent submission.

- Users shall be able to edit or delete their own wants after creation.

- Wants shall include timestamps for creation and last modification.    

- The system shall prevent unauthorized users from creating or editing wants.

#### 3.1.2.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-7  | A registered user shall be able to create a new want with a title and description.                              | High     |       |
| FR-8  | A registered user shall be able to optionally add tags to a want.                                               | Medium   |       |
| FR-9  | A registered user shall be able to upload images associated with the want.                                      | Medium   |       |
| FR-10 | The system shall save wants and display them in the public feed.                                                | High     |       |
| FR-11 | Users shall only be able to edit or delete their own wants.                                                     | High     |       |
| FR-12 | The system shall validate that required fields are not empty before submission.                                 | High     |       |
| FR-12a | The system shall prevent editing of wants with PENDING, ACCEPTED, or COMPLETED exchanges.                      | High     |       |
| FR-12b | The system shall display edit lock status to the user when a want cannot be edited.                            | Medium   |       |

#### 3.1.2.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Wants shall be saved and displayed in the feed within 2 seconds under normal load.                                     | High      |
| Security        | Only authenticated users shall be able to create, edit, or delete wants.                                                | High      |
| Usability       | The create-want form shall be responsive and accessible on desktop and mobile devices.                                 | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.3 Feature 1.3 - View Offers and Wants

#### 3.1.3.1 Description

This feature allows users to view offers and wants. Users can view offers and wants in the public feed.

#### 3.1.3.2 User Story

> As a _user_, I want to _view offers and wants in the public feed_ so that _I can see what other users are offering and requesting_.

#### 3.1.3.3 Acceptance Criteria

- Given a user, when they view the public feed, then the offers and wants are displayed in the feed.

- Given no offers or wants are available, the system shall display a message indicating that there are no offers or wants to display.

- Users shall be able to search for offers and wants by title, description, tags, or location.

- Users shall be able to filter offers and wants by tags, location, or category.

- Users shall be able to sort offers and wants by creation date, title, or location.

- Users shall be able to view the details of an offer or want by clicking on it.

#### 3.1.3.4 Functional Requirements

| ID    | Requirement                                                                                                                           | Priority | Notes |
|-------|---------------------------------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-13 | A user shall be able to view the public feed.                                                                                         | High     |       |
| FR-14 | A user shall be able to search for offers and wants by title, description, tags, or location.                                        | Medium   |       |
| FR-15 | A user shall be able to filter offers and wants by tags, location, or category.                                                      | Medium   |       |
| FR-16 | A user shall be able to sort offers and wants by creation date, title, or location.                                                  | Medium   |       |
| FR-17 | A user shall be able to view the details of an offer or want by clicking on it.                                                      | High     |       |

#### 3.1.3.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Offers and wants shall be displayed in the feed within 2 seconds under normal load.                                   | High      |
| Security        | Only authenticated users shall be able to view offers and wants.                                                      | High      |
| Usability       | The view-offers-wants page shall be responsive and accessible on desktop and mobile devices.                          | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.4 Feature 1.4 - User Onboarding

#### 3.1.4.1 Description

This feature allows users to onboard themselves to the platform. Users can create a profile, add a profile picture, and add a bio. The system stores the user's profile for retrieval, editing, and display on the public feed.

#### 3.1.4.2 User Story

> As a _user_, I want to _onboard myself to the platform_ so that _I can start using the platform_.

#### 3.1.4.3 Acceptance Criteria

- Given a user, when they onboard themselves to the platform, then the user's profile is saved in the system and appears on the public feed.

- Given missing required fields (name or email), the system shall display an error message and prevent submission.

- Users shall be able to edit or delete their own profile after onboarding.

- Profiles shall include timestamps for creation and last modification.

- The system shall prevent unauthorized users from creating or editing profiles.

#### 3.1.4.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-18 | A user shall be able to create a new profile with a name and email.                                             | High     |       |
| FR-19 | A user shall be able to optionally add a profile picture to their profile.                                      | Medium   |       |
| FR-20 | A user shall be able to edit or delete their own profile after onboarding.                                      | High     |       |
| FR-21 | Profiles shall include timestamps for creation and last modification.                                           | High     |       |
| FR-22 | The system shall prevent unauthorized users from creating or editing profiles.                                  | High     |       |

#### 3.1.4.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Profiles shall be saved and displayed in the feed within 2 seconds under normal load.                                  | High      |
| Security        | Only authenticated users shall be able to create, edit, or delete profiles.                                            | High      |
| Usability       | The onboarding form shall be responsive and accessible on desktop and mobile devices.                                  | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.5 Feature 1.5 - Transaction History

#### 3.1.6.1 Description

This feature allows users to view their transaction history. Users can view their transaction history and track their progress. The system stores the transaction history for retrieval, editing, and display on the public feed.

#### 3.1.6.2 User Story

> As a _user_, I want to _view my transaction history_ so that _I can track my progress_.

#### 3.1.6.3 Acceptance Criteria

- Given a user, when they view their transaction history, then the transaction history is displayed in the history.

- Given no transactions are available, the system shall display a message indicating that there are no transactions to display.

- Users shall be able to view the details of a transaction by clicking on it.

#### 3.1.6.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-27 | A user shall be able to view their transaction history.                                                         | High     |       |
| FR-28 | A user shall be able to view the details of a transaction by clicking on it.                                    | High     |       |
| FR-29 | A user shall be able to track their progress by clicking on the transaction history.                            | High     |       |

#### 3.1.6.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Transactions shall be displayed in the history within 2 seconds under normal load.                                     | High      |
| Security        | Only authenticated users shall be able to view their transaction history.                                              | High      |
| Usability       | The transaction history shall be responsive and accessible on desktop and mobile devices.                              | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.7 Feature 1.7 - Handshake and Rating – 5 Step Process

#### 3.1.7.1 Description

This feature allows users to initiate a handshake and rating process with another user. Users can initiate a handshake and rating process with another user and track the progress of the handshake and rating. The system stores the handshake and rating process for retrieval, editing, and display on the public feed.

#### 3.1.7.2 User Story

> As a _user_, I want to _initiate a handshake and rating process with another user_ so that _I can track the progress of the handshake and rating_.

#### 3.1.7.3 Acceptance Criteria

- Given a user, when they initiate a handshake and rating process with another user, then the handshake and rating process is displayed in the handshake and rating process.

- Users shall be able to chat with the other user during the handshake and rating process.

- Users shall be able to view the details of a handshake and rating process by clicking on it.

- Users shall be able to track the progress of the handshake and rating process by clicking on the handshake and rating process.

- The system shall prevent unauthorized users from initiating a handshake and rating process.

- The system shall validate that required fields are not empty before submission.

#### 3.1.7.4 Functional Requirements

| ID    | Requirement                                                                                                                              | Priority | Notes |
|-------|------------------------------------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-30 | A user shall be able to initiate a handshake and rating process with another user.                                                     | High     |       |
| FR-31 | A user shall be able to chat with the other user during the handshake and rating process.                                              | High     |       |
| FR-32 | A user shall be able to view the details of a handshake and rating process by clicking on it.                                          | High     |       |
| FR-33 | A user shall be able to track the progress of the handshake and rating process by clicking on the handshake and rating process.        | High     |       |
| FR-34 | The system shall display a message indicating that there are no handshake and rating processes to display.                             | High     |       |
| FR-35 | The system shall prevent unauthorized users from initiating a handshake and rating process.                                            | High     |       |
| FR-36 | The system shall validate that required fields are not empty before submission.                                                        | High     |       |
| FR-36a | A requester shall be able to cancel their PENDING or ACCEPTED exchange.                                                                | High     |       |
| FR-36b | The system shall return blocked time credits upon exchange cancellation.                                                               | High     |       |
| FR-36c | The system shall notify the provider when an exchange is cancelled by the requester.                                                   | High     |       |
| FR-36d | The system shall provide real-time updates for exchange status changes via WebSocket.                                                  | High     |       |
| FR-36e | A user shall be able to rate communication (1-5), punctuality (1-5), and recommendation after completing an exchange.                  | High     |       |
| FR-36f | A user shall be able to add a comment with their rating.                                                                               | Medium   |       |
| FR-36g | The system shall calculate and display average ratings on user profiles.                                                               | High     |       |

#### 3.1.7.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Handshake and rating processes shall be displayed in the handshake and rating process within 2 seconds under normal load. | High      |
| Security        | Only authenticated users shall be able to initiate a handshake and rating process.                                      | High      |
| Usability       | The handshake and rating process shall be responsive and accessible on desktop and mobile devices.                      | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.8 Feature 1.8 - Time Bank

#### 3.1.8.1 Description

This feature allows users to view their time bank. Users can view their time bank and track their progress. The system stores the time bank for retrieval, editing, and display on the public feed.

#### 3.1.8.2 User Story

> As a _user_, I want to _view my time bank_ so that _I can track my progress_.

#### 3.1.8.3 Acceptance Criteria

- Given a user, when they view their time bank, then the time bank is displayed in the time bank.

- Given no time bank is available, the system shall display a message indicating that there are no time bank to display.

- Users shall be able to view the details of a time bank by clicking on it.

#### 3.1.8.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-37 | A user shall be able to view their time bank.                                                                   | High     |       |
| FR-38 | A user shall be able to view the details of a time bank by clicking on it.                                      | High     |       |
| FR-38a | The system shall block requester's time credits when an exchange is created.                                   | High     |       |
| FR-38b | The system shall display available and blocked amounts separately.                                             | High     |       |
| FR-38c | The system shall unblock credits upon exchange cancellation.                                                   | High     |       |
| FR-38d | The system shall transfer credits from requester to provider upon exchange completion.                         | High     |       |

#### 3.1.8.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Time bank shall be displayed in the time bank within 2 seconds under normal load.                                       | High      |
| Security        | Only authenticated users shall be able to view their time bank.                                                        | High      |
| Usability       | The time bank shall be responsive and accessible on desktop and mobile devices.                                        | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.9 Feature 1.9 - Map View

#### 3.1.9.1 Description

This feature allows users to view the map. Users can list the map and see the users on the map. The system stores the map for retrieval, editing, and display on the public feed.

#### 3.1.9.2 User Story

> As a _user_, I want to _list the map and see the users on the map_ so that _I can see who is available to help me_.

#### 3.1.9.3 Acceptance Criteria

- Given a user, when they list the map and see the users on the map, then the users are displayed on the map.

- Given no users are available, the system shall display a message indicating that there are no users to display.

- Users shall be able to view the details of a user by clicking on it.

- Users shall be able to track the progress of the map by clicking on the map.

#### 3.1.9.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-39 | A user shall be able to list the map and see the offers/wants on the map.                                       | High     |       |
| FR-40 | A user shall be able to view the details of an offer/want by clicking on it on the map.                         | High     |       |
| FR-41 | A user shall be able to set a geo-location for their offer/want.                                                | High     |       |
| FR-41a | A user shall be able to filter offers/wants by distance radius from their location.                            | Medium   |       |
| FR-41b | A user shall be able to choose between remote (online) or in-person location type for offers/wants.            | High     |       |
| FR-41c | The system shall display nearby offers/wants count on the map.                                                 | Low      |       |

#### 3.1.9.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Users shall be displayed on the map within 2 seconds under normal load.                                                 | High      |
| Security        | Only authenticated users shall be able to list the map and see the users on the map.                                   | High      |
| Usability       | The map shall be responsive and accessible on desktop and mobile devices.                                              | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.10 Feature 1.10 - User Profile

#### 3.1.10.1 Description

This feature allows users to view their profile. Users can view their profile and see their offers, wants, and time bank. The system stores the profile for retrieval, editing, and display on the public feed.

#### 3.1.10.2 User Story

> As a _user_, I want to _view my profile and see my offers, wants, and time bank_ so that _I can see what I can offer and what I can request_.

#### 3.1.10.3 Acceptance Criteria

- Given a user, when they view their profile, then the profile is displayed in the profile.

- Given no offers are available, the system shall display a message indicating that there are no offers to display.

- Given no wants are available, the system shall display a message indicating that there are no wants to display.

- Given no time bank is available, the system shall display a message indicating that there are no time bank to display.

#### 3.1.10.4 Functional Requirements

| ID    | Requirement                                                                                                                           | Priority | Notes |
|-------|---------------------------------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-42 | A user shall be able to view their profile and see their offers, wants, and time bank.                                               | High     |       |
| FR-43 | A user shall be able to view their offers by clicking on the offers.                                                                 | High     |       |
| FR-44 | A user shall be able to view their wants by clicking on the wants.                                                                   | High     |       |
| FR-45 | A user shall be able to view their time bank by clicking on the time bank.                                                           | High     |       |

#### 3.1.10.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Profile shall be displayed in the profile within 2 seconds under normal load.                                           | High      |
| Security        | Only authenticated users shall be able to view their profile and see their offers, wants, and time bank.               | High      |
| Usability       | The profile shall be responsive and accessible on desktop and mobile devices.                                          | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.11 Feature 1.11 - See Other Users' Profiles

#### 3.1.11.1 Description

This feature allows users to see other users' profiles. Users can see other users' profiles and see their offers, wants, ratings, and comments. The system stores the other users' profile for retrieval, editing, and display on the public feed.

#### 3.1.11.2 User Story

> As a _user_, I want to _see other users' profiles and see their offers, wants, ratings, and comments_ so that _I can see what they can offer and what they can request_.

#### 3.1.11.3 Acceptance Criteria

- Given a user, when they see other users' profiles, then the other users' profiles are displayed in the other users' profiles.

- Given no offers are available, the system shall display a message indicating that there are no offers to display.

- Given no wants are available, the system shall display a message indicating that there are no wants to display.

- Given no ratings are available, the system shall display a message indicating that there are no ratings to display.

- Given no comments are available, the system shall display a message indicating that there are no comments to display.

#### 3.1.11.4 Functional Requirements

| ID    | Requirement                                                                                                                           | Priority | Notes |
|-------|---------------------------------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-47 | A user shall be able to see other users' profiles and see their offers, wants, ratings, and comments.                                | High     |       |
| FR-48 | A user shall be able to view their offers by clicking on the offers.                                                                 | High     |       |
| FR-49 | A user shall be able to view their wants by clicking on the wants.                                                                   | High     |       |
| FR-50 | A user shall be able to view their ratings by clicking on the ratings.                                                               | High     |       |
| FR-51 | A user shall be able to view their comments by clicking on the comments.                                                             | High     |       |

#### 3.1.11.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Other users' profiles shall be displayed in the other users' profiles within 2 seconds under normal load.             | High      |
| Security        | Only authenticated users shall be able to see other users' profiles and see their offers, wants, ratings, and comments. | High      |
| Usability       | The other users' profiles shall be responsive and accessible on desktop and mobile devices.                            | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.12 Feature 1.12 - Admin Panel

#### 3.1.12.1 Description

This feature allows admins to view the admin panel. Admins can view the admin panel and see the users, offers, wants, ratings, and comments. The system stores the admin panel for retrieval, editing, and display on the public feed.

#### 3.1.12.2 User Story

> As an _admin_, I want to _view the admin panel and see the users, offers, wants, ratings, and comments_ so that _I can manage the platform_.

#### 3.1.12.3 Acceptance Criteria

- Given an admin, when they view the admin panel, then the admin panel is displayed in the admin panel.

- Given no users are available, the system shall display a message indicating that there are no users to display.

- Given no offers are available, the system shall display a message indicating that there are no offers to display.

- Given no wants are available, the system shall display a message indicating that there are no wants to display.

- Given no ratings are available, the system shall display a message indicating that there are no ratings to display.

- Given no comments are available, the system shall display a message indicating that there are no comments to display.

#### 3.1.12.4 Functional Requirements

| ID    | Requirement                                                                                                                           | Priority | Notes |
|-------|---------------------------------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-53 | An admin shall be able to view the admin panel and see the users, offers, wants, ratings, and comments.                              | High     |       |
| FR-54 | An admin shall be able to view the users by clicking on the users.                                                                   | High     |       |
| FR-55 | An admin shall be able to view the offers by clicking on the offers.                                                                 | High     |       |
| FR-56 | An admin shall be able to view the wants by clicking on the wants.                                                                   | High     |       |
| FR-57 | An admin shall be able to view the ratings by clicking on the ratings.                                                               | High     |       |
| FR-58 | An admin shall be able to view the comments by clicking on the comments.                                                             | High     |       |
| FR-59 | An admin shall be able to view the transactions by clicking on the transactions.                                                     | High     |       |
| FR-61 | An admin shall be able to view the time bank by clicking on the time bank.                                                           | High     |       |
| FR-62 | An admin shall be able to view the handshake and rating processes by clicking on the handshake and rating processes.                 | High     |       |
| FR-62a | An admin shall be able to view KPI dashboard with total users, exchanges, and pending reports count.                                | High     |       |
| FR-62b | An admin shall be able to issue warnings to users with a message.                                                                   | High     |       |
| FR-62c | An admin shall be able to ban users with a reason.                                                                                  | High     |       |
| FR-62d | The system shall track warning count for each user.                                                                                 | High     |       |
| FR-62e | Banned users shall not be able to log in to the platform.                                                                           | High     |       |
| FR-62f | An admin shall be able to delete offers or wants.                                                                                   | High     |       |
| FR-62g | An admin shall be able to cancel exchanges and return blocked credits.                                                              | High     |       |
| FR-62h | The system shall notify affected users when content is removed or action is taken.                                                  | Medium   |       |

#### 3.1.12.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Admin panel shall be displayed in the admin panel within 2 seconds under normal load.                                   | High      |
| Security        | Only authenticated admins shall be able to view the admin panel and see the users, offers, wants, ratings, and comments. | High      |
| Usability       | The admin panel shall be responsive and accessible on desktop and mobile devices.                                      | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.13 Feature 1.13 - Flag and Report User

#### 3.1.13.1 Description

This feature allows admins to flag and report users. Admins can flag and report users and see the flagged and reported users. The system stores the flagged and reported users for retrieval, editing, and display on the public feed.

#### 3.1.13.2 User Story

> As a _admin_, I want to _flag and report users_ so that _I can manage the platform_.

#### 3.1.13.3 Acceptance Criteria

- Given a admin, when they flag and report users, then the flagged and reported users are displayed in the flagged and reported users.

- Given no flagged and reported users are available, the system shall display a message indicating that there are no flagged and reported users to display.

- Users shall be able to view the details of a flagged and reported user by clicking on it.

#### 3.1.13.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-63 | A admin shall be able to flag and report users.                                                                 | High     |       |
| FR-64 | A admin shall be able to view the flagged and reported users by clicking on the flagged and reported users.    | High     |       |
| FR-65 | A admin shall be able to view the details of a flagged and reported user by clicking on it.                     | High     |       |

#### 3.1.13.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Flagged and reported users shall be displayed in the flagged and reported users within 2 seconds under normal load. | High      |
| Security        | Only authenticated admins shall be able to flag and report users.                                                     | High      |
| Usability       | The flagged and reported users shall be responsive and accessible on desktop and mobile devices.                      | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.14 Feature 1.14 - Login and Registration

#### 3.1.14.1 Description

This feature allows users to login and register to the platform. Users can login and register to the platform and see the login and registration page. The system stores the login and registration for retrieval, editing, and display on the public feed.

#### 3.1.14.2 User Story

> As a _user_, I want to _login and register to the platform_ so that _I can use the platform_.

#### 3.1.14.3 Acceptance Criteria

- Given a user, when they login and register to the platform, then the login and registration page is displayed in the login and registration page.

- Given no login and registration page are available, the system shall display a message indicating that there are no login and registration page to display.

- Users shall be able to view the details of a login and registration page by clicking on it.

#### 3.1.14.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-66 | A user shall be able to login to the platform.                                                                 | High     |       |
| FR-67 | A user shall be able to register to the platform.                                                               | High     |       |
| FR-68 | A user shall be able to view the login and registration page by clicking on the login and registration page.    | High     |       |
| FR-69 | A user shall be able to view the details of a login and registration page by clicking on it.                     | High     |       |

#### 3.1.14.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Login and registration page shall be displayed in the login and registration page within 2 seconds under normal load. | High      |
| Security        | Only authenticated users shall be able to login and register to the platform.                                          | High      |
| Usability       | The login and registration page shall be responsive and accessible on desktop and mobile devices.                      | Medium    |
| Maintainability | The system shall prevent data loss in case of concurrent edits.                                                        | High      |

### 3.1.15 Feature 1.15 - Notification System

#### 3.1.15.1 Description

This feature allows users to receive and manage notifications. Users can view notifications, mark them as read/unread, and clear all notifications. The system sends notifications for important events like exchange requests, acceptances, completions, and admin actions.

#### 3.1.15.2 User Story

> As a _registered user_, I want to _receive notifications about my exchanges and platform activities_ so that _I can stay informed about important events_.

#### 3.1.15.3 Acceptance Criteria

- Given a user, when an important event occurs (exchange request, acceptance, completion), then the user receives a notification.

- Users shall be able to view all their notifications in a dedicated page.

- Users shall be able to mark individual notifications as read or unread.

- Users shall be able to mark all notifications as read at once.

- Unread notification count shall be displayed in the navigation bar.

#### 3.1.15.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-70 | The system shall send notifications to users when important events occur.                                       | High     |       |
| FR-71 | A user shall be able to view all their notifications.                                                           | High     |       |
| FR-72 | A user shall be able to mark individual notifications as read or unread.                                        | Medium   |       |
| FR-73 | A user shall be able to mark all notifications as read at once.                                                 | Medium   |       |
| FR-74 | The system shall display unread notification count in the navigation bar.                                       | High     |       |
| FR-75 | A user shall be able to filter notifications by read/unread status.                                             | Low      |       |

#### 3.1.15.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Notifications shall be delivered within 1 second of the triggering event.                                              | High      |
| Security        | Only the user to whom the notification belongs shall be able to view or manage it.                                     | High      |
| Usability       | The notification interface shall be intuitive and accessible on all devices.                                           | Medium    |

### 3.1.16 Feature 1.16 - User Report System

#### 3.1.16.1 Description

This feature allows registered users to report inappropriate content or behavior. Users can report offers, wants, exchanges, or other users with a reason and description. Admins can then review and act on these reports.

#### 3.1.16.2 User Story

> As a _registered user_, I want to _report inappropriate content or users_ so that _the platform remains safe and respectful_.

#### 3.1.16.3 Acceptance Criteria

- Given a user, when they encounter inappropriate content, then they can submit a report with a reason.

- Users shall be able to select a reason category (spam, inappropriate, harassment, fraud, etc.).

- Users shall be able to add an optional description to the report.

- The system shall prevent duplicate reports from the same user for the same target.

#### 3.1.16.4 Functional Requirements

| ID    | Requirement                                                                                                     | Priority | Notes |
|-------|-----------------------------------------------------------------------------------------------------------------|----------|-------|
| FR-76 | A user shall be able to report an offer, want, exchange, or another user.                                       | High     |       |
| FR-77 | A user shall be able to select a reason category for the report.                                                | High     |       |
| FR-78 | A user shall be able to add a description to the report.                                                        | Medium   |       |
| FR-79 | The system shall prevent duplicate reports from the same user for the same target.                              | Medium   |       |

#### 3.1.16.5 Nonfunctional Requirements

| Type            | Description                                                                                                            | Priority |
|-----------------|------------------------------------------------------------------------------------------------------------------------|-----------|
| Performance     | Report submission shall complete within 2 seconds.                                                                     | High      |
| Security        | Reports shall only be viewable by admins and the reporting user.                                                       | High      |

---

## 4. Nonfunctional Requirements

### 4.1 Performance Requirements

- The system shall respond to user actions within 2 seconds under normal load.
- The system shall handle at least 50 requests per second.
- The system shall be able to scale to support more users as needed.

### 4.2 Security Requirements

- All sensitive user data shall be encrypted in transit and at rest.
- Passwords shall be securely hashed.
- Access to data and actions shall be restricted by user roles.
- Only authorized users shall access admin functionality.
- The system shall validate inputs to prevent security vulnerabilities.
- Security events shall be logged, and audit logs shall be available to admins.
- The system shall comply with data protection laws and shall support user data deletion.

### 4.3 Usability Requirements

- The interface shall be simple and easy to use.
- Key actions (login, registration, creating/searching offers) shall be completed in no more than 3 steps.
- The user interface shall be responsive and work on both desktop and mobile devices.

### 4.4 Reliability and Availability

- The system shall be available 99.9% of the time, with scheduled maintenance periods of no more than 1 hour per month.
- The system shall be able to recover from failures and continue operating without data loss.
- The system shall be able to handle at least 100 concurrent users without significant performance degradation.
- The system shall be able to handle at least 1000 requests per second without significant performance degradation.

### 4.5 Portability

- The system shall be able to run on any Linux-based server.
- The website shall be accessible from any web browser.

### 4.6 Scalability

- The system shall be able to scale to support more users as needed.
- The system shall be able to scale to support more requests per second as needed.
- The system shall be able to scale to support more concurrent users as needed.
- The system shall be able to scale to support more data as needed.
- The system shall be able to scale to support more storage as needed.

---

## 5. System Models (Optional)

- **Use Case Diagram**

- **User Flow / Wireframe**

- **Sequence or Activity Diagrams**

- **Data Model (ER or Class Diagram)**

---

## 6. Glossary (Optional)

- **Offer** - An offer to provide a service.
- **Want** - A want to request a service.
- **Exchange** - An exchange of a service between two users.
- **Handshake** - A handshake (exchange process) between two users.
- **TimeBank** - A time bank for the system where users store time credits.
- **TimeBankTransaction** - A time bank transaction record.
- **Notification** - A message sent to a user about platform events.
- **Report** - A user-submitted complaint about content or behavior.
- **Rating** - Feedback given after completing an exchange.
- **WebSocket** - A real-time communication protocol for instant updates.
- **Blocked Credits** - Time credits reserved for pending exchanges.
- **Available Credits** - Time credits available for new exchanges.
- **KPI** - Key Performance Indicator, metrics for monitoring platform health.
- **Geo-location** - Geographic coordinates (latitude/longitude) of a location.
- **Provider** - The user who offers/provides a service in an exchange.
- **Requester** - The user who requests/receives a service in an exchange.

---

## 7. Appendices

- Prototype or mockup links

- References to Agile artifacts (e.g., Product Backlog, Sprint Backlog)
