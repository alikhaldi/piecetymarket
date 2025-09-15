// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.getElementById("storeForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to create a store profile.");
    return;
  }

  const storeName = document.getElementById("storeName").value;
  const storeAddress = document.getElementById("storeAddress").value;

  // Collect selected categories
  const categories = Array.from(document.querySelectorAll('#storeCategories input:checked'))
    .map(cb => cb.value);

  // Collect selected brands
  const brands = Array.from(document.querySelectorAll('#storeBrands input:checked'))
    .map(cb => cb.value);

  try {
    await db.collection("stores").doc(user.uid).set({
      ownerId: user.uid,
      name: storeName,
      address: storeAddress,
      categories,
      brands,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update user role (just in case)
    await db.collection("users").doc(user.uid).update({
      role: "store"
    });

    alert("✅ Store profile created successfully!");
    window.location.href = "index.html"; // Redirect to homepage
  } catch (error) {
    console.error("Error saving store profile:", error);
    alert("❌ Error saving store profile.");
  }
});
