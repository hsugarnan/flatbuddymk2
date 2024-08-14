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

  const fetchUserData = async (currentUser) => {
    const firestore = getFirestore();
    try {
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() || {};
        setUsername(userData.username || '');
        setEmail(userData.email || '');
        setFlatNum(userData.flatNum);

        if (userData.flatNum !== "") {
          const flatsQuery = query(collection(firestore, 'flats'), where('flatNum', '==', userData.flatNum));
          const querySnapshot = await getDocs(flatsQuery);

          if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
              const flatData = doc.data();
              setFlatName(flatData.flatName);
              setFlatMemb(flatData.userEmails);

              // Fetch usernames and image links for each occupant email
              fetchUsernamesAndImgLinks(flatData.userEmails);
            });
          } else {
            setError('Flat not found!');
          }
        }
      } else {
        setError('No such user document!');
        setUsername('');
        setEmail('');
        setFlatNum('');
      }
    } catch (error) {
      setError('Failed to fetch user data');
      console.error('Error fetching user data: ', error);
    }
  };

  const fetchUsernamesAndImgLinks = async (userEmails) => {
    const firestore = getFirestore();
    const userData = await Promise.all(userEmails.map(async (email) => {
      const usersQuery = query(collection(firestore, 'users'), where('email', '==', email));
      const usersSnapshot = await getDocs(usersQuery);
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0].data();
        return {
          username: userDoc.username,
          imgLink: userDoc.imgLink
        };
      }
      return { username: email, imgLink: '' }; // Fallback to email if username or imgLink is not found
    }));

    setFlatMembUsernames(userData.map(data => data.username));
    setFlatMembImgLinks(userData.map(data => data.imgLink));
  };

  const refetch = useCallback(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setLoading(true);
      fetchUserData(currentUser).finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser).finally(() => setLoading(false));
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, username, email, flatNum, flatName, flatMemb, flatMembUsernames, flatMembImgLinks, loading, error, refetch };
};

export default useFetchUser;
