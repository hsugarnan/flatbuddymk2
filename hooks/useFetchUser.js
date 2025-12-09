import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, query, where, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBNcTckaLPZpAL3q5T_1KlJCDji_yjMs1A",
  authDomain: "flatbuddy-mk1.firebaseapp.com",
  projectId: "flatbuddy-mk1",
  storageBucket: "flatbuddy-mk1.appspot.com",
  messagingSenderId: "369948891874",
  appId: "1:369948891874:web:5dbe9d9c3616da160b9cbb",
  measurementId: "G-MTV0H8F1Y1"
};

const useFetchUser = () => {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [flatNum, setFlatNum] = useState('');
  const [flatName, setFlatName] = useState('');
  const [flatMemb, setFlatMemb] = useState([]);
  const [flatMembUsernames, setFlatMembUsernames] = useState([]);
  const [flatMembImgLinks, setFlatMembImgLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch User Document ---
  const fetchUserData = async (currentUser) => {
    const firestore = getFirestore();

    try {
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        setUsername(userData.username || currentUser.email.split("@")[0]);
        setEmail(userData.email || currentUser.email);
        setFlatNum(userData.flatNum || "");

        // If user belongs to a flat → fetch occupants
        if (userData.flatNum) {
          const flatsQuery = query(
            collection(firestore, 'flats'),
            where('flatNum', '==', userData.flatNum)
          );

          const querySnapshot = await getDocs(flatsQuery);

          if (!querySnapshot.empty) {
            const flatData = querySnapshot.docs[0].data();

            setFlatName(flatData.flatName || "");
            setFlatMemb(flatData.userEmails || []);

            // Fetch usernames + images for all occupants
            fetchUsernamesAndImgLinks(flatData.userEmails || []);
          } else {
            setError("Flat not found");
          }
        }

      } else {
        setError("No such user document");
        setUsername('');
        setEmail('');
        setFlatNum('');
      }

    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to fetch user data");
    }
  };

  // --- Fetch Usernames + Image Links for Occupants ---
  const fetchUsernamesAndImgLinks = async (userEmails) => {
    const firestore = getFirestore();

    const userData = await Promise.all(
      userEmails.map(async (email) => {
        try {
          const usersQuery = query(
            collection(firestore, 'users'),
            where('email', '==', email)
          );

          const usersSnapshot = await getDocs(usersQuery);

          if (!usersSnapshot.empty) {
            const data = usersSnapshot.docs[0].data();

            return {
              username:
                (data.username && data.username.trim() !== "")
                  ? data.username
                  : email.split("@")[0], // <-- FIX: fallback to name, NOT email
              imgLink: data.imgLink || ""
            };
          }

          // No user doc found → fallback
          return {
            username: email.split("@")[0],
            imgLink: ""
          };

        } catch (err) {
          console.error("Error fetching occupant:", err);
          return {
            username: email.split("@")[0],
            imgLink: ""
          };
        }
      })
    );

    setFlatMembUsernames(userData.map(u => u.username));
    setFlatMembImgLinks(userData.map(u => u.imgLink));
  };

  // --- Refetch Helper ---
  const refetch = useCallback(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setLoading(true);
      fetchUserData(currentUser).finally(() => setLoading(false));
    }
  }, []);

  // --- Auth Listener ---
  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser).finally(() => setLoading(false));
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return {
    user,
    username,
    email,
    flatNum,
    flatName,
    flatMemb,
    flatMembUsernames,
    flatMembImgLinks,
    loading,
    error,
    refetch
  };
};

export default useFetchUser;
