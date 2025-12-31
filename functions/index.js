const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.autoExpireSupport = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const db = admin.firestore();
    const today = new Date();

    const snapshot = await db
      .collection("projects")
      .where("supportStatus", "in", ["Active", "Expire Soon"])
      .get();

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const endDateStr = data.supportEndDate;
      if (endDateStr) {
        const endDate = new Date(endDateStr);
        if (endDate < today) {
          batch.update(doc.ref, { supportStatus: "Expired" });
        }
      }
    });

    await batch.commit();
    console.log("Support status auto-expired check completed.");
    return null;
  });
