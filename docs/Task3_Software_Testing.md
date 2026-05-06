# Task 3: Software Testing & Test Case Development

## 1. Testing Strategy

The testing strategy for MistriPro was kept simple and practical. The project is a Next.js application with MongoDB models, Clerk authentication, Cloudinary uploads, and Pusher notifications, so external services were not called directly during automated tests. Instead, those services were mocked where needed.

- Unit Testing: Used to check small validation rules in Mongoose models, such as review rating limits, proposal duration, and attachment message data.
- Integration Testing: Used to test server actions and API route behavior with mocked Clerk, MongoDB, Cloudinary, and Pusher services.
- System Testing: Written as end-to-end scenarios for the main user flows, because no browser testing framework was already configured in the project.

The main features checked were proposal validation, review validation, media upload limits, notification storage, project alerts, and inbox message validation. The project also uses a dummy escrow payment system to simulate the booking/payment flow. Login, full project creation, and the complete dummy escrow flow were documented as system scenarios because they need a signed-in browser session and real database state.

## 2. Functional Testing

### 2.1 Unit Testing

Purpose: To test small pieces of validation logic without running the full application.

What was tested:
- Review rating must stay between 1 and 5.
- Proposal duration must be at least 1.
- Attachment-only chat messages can store media metadata.

Tools/approach used:
- Vitest
- Mongoose model `validateSync()`
- No real database connection

Result: Unit tests passed. The model validations behaved as expected.

### 2.2 Integration Testing

Purpose: To test important backend behavior while replacing external services with mocks.

What was tested:
- Notification storage using `storeNotification`.
- Project alert validation and saved filter normalization.
- Proposal bid validation for zero bid amount.
- Review rating validation in the server action.
- Inbox message validation for empty and too-long messages.
- Upload API validation for missing file and file size limit.
- Attachment download API validation for invalid external URLs.

Tools/approach used:
- Vitest
- Mocked Clerk user session
- Mocked MongoDB model methods
- Mocked Pusher trigger calls
- API route handlers called directly in tests

Result: Integration tests passed. The tested server actions and API routes returned the expected validation errors or saved normalized data.

### 2.3 System Testing

Purpose: To describe complete user flows from the user's point of view.

What was tested:
- Client signs in and posts a project.
- Worker browses and filters projects.
- Worker submits a proposal.
- Client receives a notification and opens the proposal.
- Client hires a worker using dummy escrow payment.
- Worker requests completion.
- Client approves completion and releases dummy escrow payment.
- Client and worker submit reviews.

Tools/approach used:
- Manual system test scenarios based on implemented routes and UI.
- Routes inspected include `/sign-in`, `/sign-up`, `/projects`, `/projects/post`, `/projects/[id]`, `/projects/[id]/apply`, `/inbox`, `/projects/hires`, and profile pages.

Result: These scenarios are documented for manual execution. Automated browser testing was not added because Playwright/Cypress was not already configured and the assignment only required a beginner-friendly test setup.

## 3. Detailed Test Cases

| Test Case ID | Feature Name | Input Data | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| TC-01 | User login/signup using Clerk | User opens `/sign-in` or `/sign-up` and authenticates with valid credentials | Clerk authenticates user and redirects to `/profile-setup` or `/dashboard` | Clerk pages are implemented with `SignIn` and `SignUp`. Not automated because Clerk is an external auth service. | Not executed |
| TC-02 | Create project/job post | Title: "Kitchen plumbing repair", skill: "Plumbing", location: "Lahore", budget: 5000 fixed | Project is created with status `open` and appears in project browsing for workers | `/projects/post` and `createProject` are implemented. Full flow needs authenticated browser and database. | Not executed |
| TC-03 | Browse/filter projects | Search: "Kitchen", category: "Plumbing", sort: newest | Matching projects are shown and non-matching projects are hidden | Browse page filtering and sorting logic exists in `BrowseProjectsClient`. Browser flow was not automated. | Not executed |
| TC-04 | Submit proposal/bid validation | Project ID: `project_1`, bid amount: 0, duration: 2 days | Proposal is rejected because bid amount must be greater than zero | Automated test returned error: "Bid amount must be greater than zero". | Pass |
| TC-05 | Bid validation/ranking | Project ID with multiple proposals and worker ratings | Proposals should be sorted by worker rating and time when loaded | `getProjectProposals` sorts by `freelancerRating` descending and `createdAt` ascending. Not executed with real DB data. | Not executed |
| TC-06 | Audio/media upload validation | No file sent to `/api/upload` | API returns validation error | Automated test returned 400 with "No file provided". | Pass |
| TC-07 | Media/file upload size | File size: 25 MB + 1 byte | API rejects file above allowed limit | Automated test returned 400 with "File is larger than 25 MB". | Pass |
| TC-08 | Real-time notification storage | Notification type: `new-bid`, recipient: `client_1`, href: proposal link | Notification is saved/upserted for the recipient | Automated test confirmed notification was stored with recipient and created date. | Pass |
| TC-09 | Inbox/chat message validation | Empty message text and no attachments | Message is rejected | Automated test returned error: "Message cannot be empty". | Pass |
| TC-10 | Dummy Escrow Payment Flow | Client hires worker for bid amount Rs. 5000 and confirms dummy escrow deposit | Contract/hire is created, payment status becomes deposited, and job can proceed | Code inspection confirms `acceptProposalAndDeposit` creates a contract, sets payment status to `deposited`, accepts the selected proposal, rejects other pending proposals, and changes project status to `in-progress`. Full browser flow still needs manual verification. | Not executed |
| TC-11 | Completion Approval and Dummy Payment Release | Worker requests completion, client approves completion | Job is marked completed and dummy escrow payment is released | Code inspection confirms `requestProjectCompletion` changes contract status to `completion-requested`, and `approveProjectCompletion` changes status to `completed`, payment status to `released`, and project status to `closed`. Full browser flow still needs manual verification. | Not executed |
| TC-12 | Job completion and review validation | Completed contract, rating: 6 | Review is rejected because rating must be 1 to 5 | Automated test returned error: "Rating must be between 1 and 5". | Pass |

Notes:
- The project uses a dummy escrow payment system to simulate the booking/payment flow.
- This dummy escrow flow covers hiring, deposit/payment simulation, completion approval, and payment release.
- A real banking/payment gateway is outside the scope of the classroom prototype and can be listed as a future enhancement, not a bug.

## 4. Boundary Value Analysis

Only features with clear minimum and maximum limits in the actual code were used for BVA. Bid amount was removed from this section because the code has a minimum rule but no maximum limit. Media upload size was also not used here because the code has a 25 MB maximum file-size limit but no separate minimum file-size limit. Media upload is still covered in the detailed test cases.

| Feature | Boundary Type | Test Input | Expected Output | Actual Output | Status |
|---|---|---|---|---|---|
| Review Rating | Minimum boundary | 1 | Rating is valid | Automated model test accepted rating 1. | Pass |
| Review Rating | Maximum boundary | 5 | Rating is valid | Automated model test accepted rating 5. | Pass |
| Review Rating | Just below minimum | 0 | Reject rating | Automated model test rejected rating 0. | Pass |
| Review Rating | Just above maximum | 6 | Reject rating | Automated model/action tests rejected rating 6. | Pass |
| Review Comment Length | Minimum boundary | 1 character | Review comment is valid | Automated model test accepted a 1-character comment. | Pass |
| Review Comment Length | Maximum boundary | 1000 characters | Review comment is valid | Automated model test accepted a 1000-character comment. | Pass |
| Review Comment Length | Just below minimum | Empty comment | Reject review comment | Automated model test rejected an empty comment. | Pass |
| Review Comment Length | Just above maximum | 1001 characters | Reject review comment | Automated model test rejected a 1001-character comment. | Pass |
| Inbox Message Text | Minimum boundary | 1 character | Message text is valid | Code inspection confirms `sendMessage` accepts non-empty text; full DB flow not executed for this boundary. | Not executed |
| Inbox Message Text | Maximum boundary | 2000 characters | Message text is valid | Code inspection confirms `sendMessage` allows text up to 2000 characters. | Not executed |
| Inbox Message Text | Just below minimum | Empty text and no attachments | Reject message | Automated test rejected with "Message cannot be empty". | Pass |
| Inbox Message Text | Just above maximum | 2001 characters | Reject message | Automated test rejected with "Message is too long". | Pass |

## 5. Test Execution Summary

- Automated test files: 3
- Automated test cases run by Vitest: 16
- Automated passed: 16
- Automated failed: 0
- Report table test cases: 12
- Report table passed: 6
- Report table failed: 0
- Report table not executed: 6
- Main bugs found: No new failing bugs were found in the tested validation paths. The dummy escrow payment flow is implemented as a prototype payment simulation and should be manually verified in the browser before submission.
- Final testing conclusion: The tested backend validations and API route checks passed. MistriPro has working validation coverage for bids, reviews, upload limits, notifications, alerts, and chat messages. The dummy escrow payment system is included as the project payment prototype for hiring, completion approval, and payment release. Full system testing should still be done manually before final submission.


## Manual Testing Evidence

Manual system testing was also performed using the browser. Screenshots were collected as proof of the main project flow.

| Evidence No. | Screenshot File | Purpose |
|---|---|---|
| 01 | 01-npm-test-passed.png | Shows that all automated Vitest tests passed. |
| 02 | 02-project-posted.png | Shows that the client successfully posted a project. |
| 03 | 02-project-posted-on-browse-projects-page.png | Shows that the posted project appeared on the browse projects page. |
| 04 | 03-proposal-submitted.png | Shows that the worker submitted a proposal/bid. |
| 05 | 04-client-view-proposal.png | Shows that the client viewed the received proposal. |
| 06 | 05-project-accepted.png | Shows that the client accepted the proposal and started the hire flow. |
| 07 | 06-completion-requested-in-review.png | Shows that the worker requested completion and the project entered review state. |
| 08 | 07-project-completion-approved-and-payment-released.png | Shows that the client approved completion and dummy escrow payment was released. |
| 09 | 08-review-submitting.png | Shows the review/rating form being submitted. |
| 10 | 08-review-submitted.png | Shows that the review was submitted successfully. |

## 6. How to Run Tests

Install dependencies:

```bash
npm install
```

Run automated tests:

```bash
npm test
```

Run production build:

```bash
npm run build
```

Optional lint check:

```bash
npm run lint
```

Note: `npm run lint` may still show existing lint issues in the project that are not related to this testing task.
