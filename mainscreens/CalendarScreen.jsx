import React, { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, RefreshControl } from 'react-native';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getFirestore, collection, getDocs, addDoc, query, where, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import useFetchUser from '../hooks/useFetchUser';

const firebaseConfig = {
  apiKey: "AIzaSyBNcTckaLPZpAL3q5T_1KlJCDji_yjMs1A",
  authDomain: "flatbuddy-mk1.firebaseapp.com",
  projectId: "flatbuddy-mk1",
  storageBucket: "flatbuddy-mk1.appspot.com",
  messagingSenderId: "369948891874",
  appId: "1:369948891874:web:5dbe9d9c3616da160b9cbb",
  measurementId: "G-MTV0H8F1Y1"
};

const CalendarScreen = ({ route, navigation }) => {
  const [chores, setChores] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('');
  const [endDate, setEndDate] = useState(new Date());
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [loadingRemove, setLoadingRemove] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [activeChores, setActiveChores] = useState([]);
  const [startingUser, setStartingUser] = useState('random'); // 'random' or a username
  const [showStarterPicker, setShowStarterPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0); // Key to force calendar re-render
  const { username, flatNum, email, flatMembUsernames, flatMembVacated, isVacated, flatName, loading, error, refetch, imgLink, flatMemb } = useFetchUser();
  
  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  const auth = getAuth();

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchChores();
      await fetchActiveChores();
      if (typeof refetch === 'function') await refetch();
      // Force calendar to re-render with new data
      setCalendarKey(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
  }, [flatNum, username]);

  // Add reload button to header
  useEffect(() => {
    if (!navigation || !onRefresh) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={onRefresh} style={{ marginRight: 16 }}>
          <Ionicons name="reload" size={24} color="#007bff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, onRefresh]);

  // Get active (non-vacated) flatmates
  const getActiveFlatmates = () => {
    return flatMembUsernames.filter((_, index) => !flatMembVacated[index]);
  };

  useEffect(() => {
    if (auth.currentUser && flatNum) {
      fetchChores();
      fetchActiveChores();
    }
  }, [auth.currentUser, flatNum]);

  const fetchChores = async () => {
    if (!flatNum) return;

    const choresQuery = query(collection(firestore, 'chores'), where('flatID', '==', flatNum));
    const querySnapshot = await getDocs(choresQuery);
    const choresData = {};
    const dates = {};

    querySnapshot.forEach(doc => {
      const data = doc.data();
      const date = data.date;
      if (!choresData[date]) {
        choresData[date] = [];
      }
      choresData[date].push({ ...data, id: doc.id });
      dates[date] = dates[date] || { dots: [] };

      if (data.userEmail === username) {
        dates[date].dots.push({ color: 'blue', selectedDotColor: 'blue' });
      } else {
        dates[date].dots.push({ color: 'gray', selectedDotColor: 'gray' });
      }
    });

    setChores(choresData);
    setMarkedDates(dates);
  };

  const fetchActiveChores = async () => {
    if (!flatNum) return;

    const choresQuery = query(collection(firestore, 'chores'), where('flatID', '==', flatNum));
    const querySnapshot = await getDocs(choresQuery);
    const activeChoresData = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      activeChoresData.push({ ...data, id: doc.id });
    });

    setActiveChores(activeChoresData);
  };

  const handleAddChore = async () => {
    if (!name || !frequency || isNaN(frequency)) {
      alert('Please enter valid chore details');
      return;
    }

    const user = auth.currentUser;
    if (user) {
      setLoadingAdd(true);
      try {
        const newChore = {
          choreName: name,
          frequency: parseInt(frequency),
          flatID: flatNum,
          userEmail: user.email,
          endDate: endDate.toISOString().split('T')[0],
        };

        await assignChores(newChore);
        fetchChores(); // Refetch chores to update UI
        fetchActiveChores(); // Refetch active chores to update UI
      } catch (error) {
        alert(error.message);
      } finally {
        setLoadingAdd(false);
      }
    }
  };

   // This function will now only remove a specific chore instance based on its ID
   const handleRemoveChoreInstance = async (choreId) => {
    setLoadingRemove(prev => ({ ...prev, [choreId]: true }));
    try {
      const choreDocRef = doc(firestore, 'chores', choreId);
      await deleteDoc(choreDocRef);

      fetchChores(); // Refetch chores to update UI
      fetchActiveChores(); // Refetch active chores to update UI
    } catch (error) {
      console.error('Error removing chore: ', error);
    } finally {
      setLoadingRemove(prev => ({ ...prev, [choreId]: false }));
    }
  };

  const assignChores = async (chore) => {
    const today = new Date();
    const activeFlatmates = getActiveFlatmates(); // Only non-vacated users
    const numFlatmates = activeFlatmates.length;
    const end = new Date(chore.endDate);

    if (numFlatmates === 0) {
      alert('No active flatmates available to assign chores. All members have vacated.');
      return;
    }
  
    if (chore.frequency < 1 || chore.frequency > 7) {
      alert('Frequency should be between 1 and 7');
      return;
    }
  
    // Determine user order based on selection (only from active flatmates)
    let orderedUsers;
    if (startingUser === 'random' || !activeFlatmates.includes(startingUser)) {
      orderedUsers = shuffleArray(activeFlatmates); // Shuffle only active users
    } else {
      // Start with selected user, then rotate through others
      const startIndex = activeFlatmates.indexOf(startingUser);
      orderedUsers = [
        ...activeFlatmates.slice(startIndex),
        ...activeFlatmates.slice(0, startIndex)
      ];
    }
    let j = 0;
  
    let choreDate = new Date(today);
  
    while (choreDate <= end) {
      const dateString = choreDate.toISOString().split('T')[0];
  
      const newChore = {
        choreName: chore.choreName,
        date: dateString,
        flatID: chore.flatID,
        userEmail: orderedUsers[j], // Use ordered users based on selection
      };
  
      await addDoc(collection(firestore, 'chores'), newChore);
  
      choreDate.setDate(choreDate.getDate() + Math.floor(7 / chore.frequency));
      j = (j + 1) % numFlatmates; // Ensure index wraps around
    }
  
    fetchChores();
    fetchActiveChores();
  };
  const shuffleArray = (array) => {
    let shuffledArray = array.slice();
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };
  

  const handleRemoveChore = async (choreName) => {
    setLoadingRemove(prev => ({ ...prev, [choreName]: true }));
    try {
      const choresQuery = query(collection(firestore, 'chores'), where('flatID', '==', flatNum), where('choreName', '==', choreName));
      const querySnapshot = await getDocs(choresQuery);

      const batch = writeBatch(firestore);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      fetchChores(); // Refetch chores to update UI
      fetchActiveChores(); // Refetch active chores to update UI
    } catch (error) {
      console.error('Error removing chore: ', error);
    } finally {
      setLoadingRemove(prev => ({ ...prev, [choreName]: false }));
    }
  };

  const renderChore = (chore) => {
    return (
      <View style={styles.choreItem} key={chore.id}>
        <View style={styles.choreInfo}>
          <Text style={styles.dateTitle}>{chore.date}</Text>
          <Text style={styles.choreName}>{chore.choreName}</Text>
          <Text style={styles.choreAssignedTo}>Assigned To: {chore.userEmail}</Text>
        </View>
        <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveChoreInstance(chore.id)}>
          {loadingRemove[chore.choreName] ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.removeButtonText}>Completed</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderChores = () => {
    // If user is vacated, don't show any chores
    if (isVacated) {
      return (
        <View style={styles.vacatedMessage}>
          <Text style={styles.vacatedMessageText}> You're currently away</Text>
          <Text style={styles.vacatedMessageSubtext}>Your chores are paused while you're vacated. Return to the flat to resume your chore rotation.</Text>
        </View>
      );
    }

    const userChores = Object.values(chores)
      .flat() // Flatten the array to get all chores in a single array
      .filter(chore => chore.userEmail === username) // Filter chores for the current user
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort chores by date

    // Get the next 4 chores
    const nextFourChores = userChores.slice(0, 2);

    if (nextFourChores.length === 0) {
      return <Text style={styles.noChoresText}>No upcoming chores assigned to you.</Text>;
    }

    return nextFourChores.map(chore => renderChore(chore));
  };

  const renderSelectedDateChores = () => {
    if (chores[selectedDate]) {
      return chores[selectedDate].map(chore => renderChore(chore));
    }
    return <Text>No chores for this date.</Text>;
  };

  const renderActiveChores = () => {
    // Get unique chore names
    const uniqueChores = [...new Set(activeChores.map(chore => chore.choreName))];

    return uniqueChores.map((choreName) => (
      <View style={styles.choreItem} key={choreName}>
        <Text style={styles.choreName}>{choreName}</Text>
        <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveChore(choreName)}>
          {loadingRemove[choreName] ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.removeButtonText}>Remove All</Text>
          )}
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >


      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          <Calendar
            key={calendarKey}
            markingType={'multi-dot'}
            markedDates={markedDates}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
              setModalVisible(true);
            }}
          />
          <View style={styles.choreContainer}>
            <Text style={styles.sectionTitle}>Active Chores</Text>
            {renderActiveChores()}
          </View>

          <View style={styles.choreContainer}>
            <Text style={styles.sectionTitle}>Your Upcoming Chores</Text>
            {renderChores()}
          </View>

          
          <View style={styles.formContainer}>
            <Text style={styles.disclaimerText}>
              Chores will only be assigned to the flat members currently in the hub. If any members are added or removed, you will need to remove all and reschedule the chores.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Chore Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.input}
              placeholder="Frequency per Week"
              value={frequency}
              onChangeText={setFrequency}
              keyboardType="numeric"
              placeholderTextColor="#666"
            />
            <Text style={styles.dateTitle}>End Date</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={{ color: endDate ? '#333' : '#666' }}>
                {endDate ? endDate.toDateString() : 'Select End Date'}
              </Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  const currentDate = selectedDate || endDate;
                  setShowEndDatePicker(Platform.OS === 'ios');
                  setEndDate(currentDate);
                }}
              />
            )}

            <Text style={styles.dateTitle}>Who Starts First?</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowStarterPicker(!showStarterPicker)}
            >
              <Text style={{ color: '#333' }}>
                {startingUser === 'random' ? ' Random Order' : `👤 ${startingUser}`}
              </Text>
            </TouchableOpacity>
            {showStarterPicker && (
              <View style={styles.starterPickerContainer}>
                <TouchableOpacity
                  style={[
                    styles.starterOption,
                    startingUser === 'random' && styles.starterOptionSelected
                  ]}
                  onPress={() => {
                    setStartingUser('random');
                    setShowStarterPicker(false);
                  }}
                >
                  <Text style={styles.starterOptionText}> Random Order</Text>
                </TouchableOpacity>
                {flatMembUsernames.map((user, index) => {
                  const isVacated = flatMembVacated[index];
                  return (
                    <TouchableOpacity
                      key={user}
                      style={[
                        styles.starterOption,
                        startingUser === user && styles.starterOptionSelected,
                        isVacated && styles.starterOptionDisabled
                      ]}
                      onPress={() => {
                        if (!isVacated) {
                          setStartingUser(user);
                          setShowStarterPicker(false);
                        }
                      }}
                      disabled={isVacated}
                    >
                      <Text style={[styles.starterOptionText, isVacated && styles.starterOptionTextDisabled]}>
                        {isVacated ? '✈️' : '👤'} {user} {isVacated ? '(Away)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={styles.addButton} onPress={handleAddChore}>
              {loadingAdd ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>Add Chore</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Chores for {selectedDate}</Text>
            <ScrollView style={styles.modalScrollView}>
              {renderSelectedDateChores()}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  choreContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateContainer: {
    marginVertical: 10,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  choreItem: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  choreInfo: {
    flex: 1,
  },
  choreName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  choreAssignedTo: {
    fontSize: 14,
    color: 'grey',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  formContainer: {
    marginTop: 20,
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 10,
  },
  disclaimerText: {
    color: 'red',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalScrollView: {
    maxHeight: 300,
    width: '100%',
  },
  closeButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 10,
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
  starterPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    overflow: 'hidden',
  },
  starterOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  starterOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  starterOptionDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  starterOptionText: {
    fontSize: 16,
    color: '#333',
  },
  starterOptionTextDisabled: {
    color: '#999',
    fontStyle: 'italic',
  },
  vacatedMessage: {
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    marginVertical: 10,
  },
  vacatedMessageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 5,
  },
  vacatedMessageSubtext: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noChoresText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
});

export default CalendarScreen;


