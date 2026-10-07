# Object and Blob Storage — Practice

### P1. Where does it go?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** object storage use

Where should a 3 MB profile photo be stored in a scalable design?

- A) In a BLOB column of the users table
- B) On the local disk of the app server that received it
- C) In object storage, with its key saved in the users table
- D) In Redis

<details>
<summary>Answer</summary>

**Answer:** C) In object storage, with its key saved in the users table

</details>

### P2. Upload path

**Difficulty:** Medium · **Type:** Design · **Concepts:** presigned URLs

Write the steps for a client uploading a photo without sending the bytes through the API servers.

<details>
<summary>Answer</summary>

(1) Client asks the API to start an upload; (2) API authorises, creates a PENDING record and returns a presigned PUT URL; (3) client PUTs the file directly to object storage; (4) an object-created event (or a client "done" call) triggers processing; (5) the photo is marked READY and served via the CDN.

</details>

### P3. Cost

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** storage classes

Photos older than one year are viewed rarely but must stay available within seconds. Backups must be kept seven years and are almost never restored. Choose storage classes.

<details>
<summary>Answer</summary>

Old photos: an infrequent-access class (still millisecond access, cheaper storage, retrieval fee). Backups: an archive class (cheapest storage, retrieval in minutes to hours), moved by lifecycle rules and deleted after seven years.

</details>
