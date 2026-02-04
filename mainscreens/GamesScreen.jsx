import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import FontSize from '../constants/FontSize';
import Spacing from '../constants/Spacing';

const { width } = Dimensions.get('window');

// Card Decks Data
const CARD_DECKS = {
  drinking: {
    name: 'Drinking Game',
    icon: 'beer',
    iconType: 'FontAwesome5',
    color: '#F39C12',
    description: 'Classic drinking game cards',
    cards: [
      { text: 'Waterfall! Everyone drinks until the person before them stops.', type: 'action' },
      { text: 'You! Pick someone to drink.', type: 'action' },
      { text: 'Me! You drink.', type: 'action' },
      { text: 'Floor! Last person to touch the floor drinks.', type: 'action' },
      { text: 'Guys drink!', type: 'action' },
      { text: 'Chicks drink!', type: 'action' },
      { text: 'Heaven! Last person to point up drinks.', type: 'action' },
      { text: 'Mate! Pick a drinking buddy.', type: 'action' },
      { text: 'Rhyme! Say a word, go around rhyming. First to fail drinks.', type: 'action' },
      { text: 'Categories! Pick a category, go around naming items. First to fail drinks.', type: 'action' },
      { text: 'Make a Rule! Create a rule everyone must follow.', type: 'action' },
      { text: 'Question Master! Anyone who answers your questions drinks.', type: 'action' },
      { text: 'Never Have I Ever! Say something you haven\'t done. Those who have, drink.', type: 'action' },
      { text: 'Thumb Master! When you put your thumb down, last to follow drinks.', type: 'action' },
      { text: 'Social! Everyone drinks!', type: 'action' },
      { text: 'Reverse! Change direction of play.', type: 'action' },
      { text: 'Hot Seat! Answer 3 questions honestly or drink.', type: 'action' },
      { text: 'Truth or Drink! Answer truthfully or take a sip.', type: 'action' },
      { text: 'Compliment Battle! Give compliments until someone can\'t. Loser drinks.', type: 'action' },
      { text: 'Dance Off! Worst dancer drinks.', type: 'action' },
    ],
  },
  questions: {
    name: 'Deep Questions',
    icon: 'brain',
    iconType: 'FontAwesome5',
    color: '#9B59B6',
    description: 'Get to know your flatmates better',
    cards: [
      { text: 'What\'s your biggest fear?', type: 'question' },
      { text: 'What\'s one thing on your bucket list?', type: 'question' },
      { text: 'What\'s your most embarrassing moment?', type: 'question' },
      { text: 'If you could live anywhere, where would it be?', type: 'question' },
      { text: 'What\'s a secret talent you have?', type: 'question' },
      { text: 'What\'s the best advice you\'ve ever received?', type: 'question' },
      { text: 'What would you do with a million dollars?', type: 'question' },
      { text: 'What\'s your guilty pleasure?', type: 'question' },
      { text: 'If you could have dinner with anyone, dead or alive, who would it be?', type: 'question' },
      { text: 'What\'s something you\'ve never told anyone?', type: 'question' },
      { text: 'What\'s your happiest memory?', type: 'question' },
      { text: 'If you could change one thing about yourself, what would it be?', type: 'question' },
      { text: 'What are you most grateful for?', type: 'question' },
      { text: 'What\'s your biggest regret?', type: 'question' },
      { text: 'Where do you see yourself in 10 years?', type: 'question' },
      { text: 'What\'s a deal-breaker in a friendship?', type: 'question' },
      { text: 'What makes you feel most alive?', type: 'question' },
      { text: 'What\'s your love language?', type: 'question' },
      { text: 'What\'s the craziest thing on your bucket list?', type: 'question' },
      { text: 'If today was your last day, what would you do?', type: 'question' },
    ],
  },
  wouldYouRather: {
    name: 'Would You Rather',
    icon: 'scale-balance',
    iconType: 'MaterialCommunityIcons',
    color: '#3498DB',
    description: 'Tough choices and debates',
    cards: [
      { text: 'Would you rather be able to fly or be invisible?', type: 'choice' },
      { text: 'Would you rather never use social media again or never watch another movie?', type: 'choice' },
      { text: 'Would you rather live without music or without TV?', type: 'choice' },
      { text: 'Would you rather be famous or rich?', type: 'choice' },
      { text: 'Would you rather travel back in time or into the future?', type: 'choice' },
      { text: 'Would you rather have unlimited money or unlimited time?', type: 'choice' },
      { text: 'Would you rather always be 10 minutes late or 20 minutes early?', type: 'choice' },
      { text: 'Would you rather know when you\'ll die or how you\'ll die?', type: 'choice' },
      { text: 'Would you rather have no internet or no phone?', type: 'choice' },
      { text: 'Would you rather be the funniest or smartest person in the room?', type: 'choice' },
      { text: 'Would you rather live in the city or the countryside forever?', type: 'choice' },
      { text: 'Would you rather only eat sweet or savory food for life?', type: 'choice' },
      { text: 'Would you rather have a rewind button or a pause button for life?', type: 'choice' },
      { text: 'Would you rather be able to read minds or predict the future?', type: 'choice' },
      { text: 'Would you rather give up coffee or alcohol forever?', type: 'choice' },
      { text: 'Would you rather have a personal chef or a personal driver?', type: 'choice' },
      { text: 'Would you rather be stuck in a lift with your ex or your boss?', type: 'choice' },
      { text: 'Would you rather have no heating or no air conditioning?', type: 'choice' },
      { text: 'Would you rather always speak your mind or never speak again?', type: 'choice' },
      { text: 'Would you rather be a superhero or a supervillain?', type: 'choice' },
    ],
  },
  dares: {
    name: 'Dares & Challenges',
    icon: 'fire',
    iconType: 'FontAwesome5',
    color: '#E74C3C',
    description: 'Fun challenges for the brave',
    cards: [
      { text: 'Do your best impression of another flatmate.', type: 'dare' },
      { text: 'Let the group post something on your social media.', type: 'dare' },
      { text: 'Do 10 push-ups right now.', type: 'dare' },
      { text: 'Speak in an accent for the next 3 rounds.', type: 'dare' },
      { text: 'Let someone draw on your face with a marker.', type: 'dare' },
      { text: 'Send a funny selfie to your crush or ex.', type: 'dare' },
      { text: 'Do a dramatic reading of a random text message.', type: 'dare' },
      { text: 'Let the group look through your camera roll for 30 seconds.', type: 'dare' },
      { text: 'Wear socks on your hands for the next 3 rounds.', type: 'dare' },
      { text: 'Do your best dance move for 30 seconds.', type: 'dare' },
      { text: 'Call a random contact and sing Happy Birthday.', type: 'dare' },
      { text: 'Let someone tickle you for 10 seconds.', type: 'dare' },
      { text: 'Eat a spoonful of a condiment chosen by the group.', type: 'dare' },
      { text: 'Post an embarrassing photo to your story (can delete in 5 min).', type: 'dare' },
      { text: 'Talk in third person for the next 5 minutes.', type: 'dare' },
      { text: 'Let someone style your hair however they want.', type: 'dare' },
      { text: 'Do a plank for 30 seconds.', type: 'dare' },
      { text: 'Serenade the person to your left.', type: 'dare' },
      { text: 'Exchange an item of clothing with someone for 3 rounds.', type: 'dare' },
      { text: 'Act out a scene from a movie until someone guesses it.', type: 'dare' },
    ],
  },
  icebreakers: {
    name: 'Icebreakers',
    icon: 'snowflake',
    iconType: 'FontAwesome5',
    color: '#1ABC9C',
    description: 'Perfect for new flatmates',
    cards: [
      { text: 'What\'s your go-to karaoke song?', type: 'question' },
      { text: 'What\'s the weirdest food you\'ve ever tried?', type: 'question' },
      { text: 'If you were a pizza topping, what would you be?', type: 'question' },
      { text: 'What\'s your spirit animal and why?', type: 'question' },
      { text: 'What\'s the most useless talent you have?', type: 'question' },
      { text: 'If you could only eat one cuisine forever, what would it be?', type: 'question' },
      { text: 'What\'s your most controversial food opinion?', type: 'question' },
      { text: 'What show are you currently binging?', type: 'question' },
      { text: 'What\'s the last thing that made you laugh out loud?', type: 'question' },
      { text: 'If you had a warning label, what would it say?', type: 'question' },
      { text: 'What\'s your coffee order (or tea, no judgment)?', type: 'question' },
      { text: 'What\'s the best thing that happened to you this week?', type: 'question' },
      { text: 'If you could master any skill instantly, what would it be?', type: 'question' },
      { text: 'What\'s your unpopular opinion?', type: 'question' },
      { text: 'Morning person or night owl?', type: 'question' },
      { text: 'What\'s your comfort movie?', type: 'question' },
      { text: 'Beach holiday or city break?', type: 'question' },
      { text: 'What\'s your biggest pet peeve?', type: 'question' },
      { text: 'If you won the lottery tomorrow, what\'s the first thing you\'d buy?', type: 'question' },
      { text: 'What emoji do you use the most?', type: 'question' },
    ],
  },
};

const GamesScreen = () => {
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [usedCards, setUsedCards] = useState([]);
  const [showCard, setShowCard] = useState(false);
  const [flipAnim] = useState(new Animated.Value(0));

  const selectDeck = (deckKey) => {
    setSelectedDeck(deckKey);
    setUsedCards([]);
    setCurrentCard(null);
    setShowCard(false);
  };

  const drawCard = () => {
    if (!selectedDeck) return;

    const deck = CARD_DECKS[selectedDeck];
    const availableCards = deck.cards.filter((_, index) => !usedCards.includes(index));

    if (availableCards.length === 0) {
      setUsedCards([]);
      return drawCard();
    }

    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const originalIndex = deck.cards.indexOf(availableCards[randomIndex]);

    setUsedCards([...usedCards, originalIndex]);
    setCurrentCard(availableCards[randomIndex]);

    // Flip animation
    flipAnim.setValue(0);
    setShowCard(true);
    Animated.spring(flipAnim, {
      toValue: 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  const closeDeck = () => {
    setSelectedDeck(null);
    setCurrentCard(null);
    setUsedCards([]);
    setShowCard(false);
  };

  const renderIcon = (iconName, iconType, size, color) => {
    switch (iconType) {
      case 'FontAwesome5':
        return <FontAwesome5 name={iconName} size={size} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      default:
        return <Ionicons name={iconName} size={size} color={color} />;
    }
  };

  const cardScale = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 1],
  });

  const cardOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Game Cards</Text>
        <Text style={styles.headerSubtitle}>Pick a deck and have fun!</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.decksContainer}>
          {Object.entries(CARD_DECKS).map(([key, deck]) => (
            <TouchableOpacity
              key={key}
              style={[styles.deckCard, { borderColor: deck.color }]}
              onPress={() => selectDeck(key)}
            >
              <View style={[styles.deckIconContainer, { backgroundColor: deck.color }]}>
                {renderIcon(deck.icon, deck.iconType, 32, '#fff')}
              </View>
              <Text style={styles.deckName}>{deck.name}</Text>
              <Text style={styles.deckDescription}>{deck.description}</Text>
              <Text style={styles.deckCardCount}>{deck.cards.length} cards</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Game Modal */}
      <Modal
        visible={selectedDeck !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={closeDeck}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: selectedDeck ? CARD_DECKS[selectedDeck]?.color + '15' : '#fff' }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeDeck} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedDeck ? CARD_DECKS[selectedDeck].name : ''}
            </Text>
            <View style={styles.cardCounter}>
              <Text style={styles.cardCounterText}>
                {usedCards.length}/{selectedDeck ? CARD_DECKS[selectedDeck].cards.length : 0}
              </Text>
            </View>
          </View>

          <View style={styles.cardArea}>
            {showCard && currentCard ? (
              <Animated.View
                style={[
                  styles.gameCard,
                  {
                    backgroundColor: selectedDeck ? CARD_DECKS[selectedDeck].color : Colors.primary,
                    transform: [{ scale: cardScale }],
                    opacity: cardOpacity,
                  },
                ]}
              >
                <View style={styles.cardContent}>
                  {renderIcon(
                    CARD_DECKS[selectedDeck].icon,
                    CARD_DECKS[selectedDeck].iconType,
                    40,
                    'rgba(255,255,255,0.3)'
                  )}
                  <Text style={styles.cardText}>{currentCard.text}</Text>
                </View>
              </Animated.View>
            ) : (
              <View style={styles.placeholderCard}>
                <Text style={styles.placeholderText}>Tap below to draw a card!</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.drawButton, { backgroundColor: selectedDeck ? CARD_DECKS[selectedDeck].color : Colors.primary }]}
            onPress={drawCard}
          >
            <Text style={styles.drawButtonText}>Draw Card</Text>
            <MaterialCommunityIcons name="cards" size={24} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing * 2.5,
    paddingHorizontal: Spacing * 2,
    borderBottomLeftRadius: Spacing,
    borderBottomRightRadius: Spacing,
  },
  headerTitle: {
    fontSize: FontSize.xxLarge,
    fontWeight: 'bold',
    color: Colors.onPrimary,
  },
  headerSubtitle: {
    fontSize: FontSize.medium,
    color: Colors.onPrimary,
    opacity: 0.8,
    marginTop: 4,
  },
  scrollContent: {
    padding: Spacing * 1.5,
  },
  decksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  deckCard: {
    width: (width - Spacing * 4) / 2 - Spacing / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: Spacing * 1.5,
    marginBottom: Spacing * 1.5,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deckIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing,
  },
  deckName: {
    fontSize: FontSize.large,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: FontSize.small,
    color: '#666',
    marginBottom: 8,
  },
  deckCardCount: {
    fontSize: FontSize.small,
    color: '#999',
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing * 1.5,
    paddingVertical: Spacing,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: FontSize.xLarge,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardCounter: {
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cardCounterText: {
    fontSize: FontSize.medium,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing * 2,
  },
  gameCard: {
    width: width - Spacing * 6,
    height: 300,
    borderRadius: 20,
    padding: Spacing * 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardText: {
    fontSize: FontSize.xLarge,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginTop: Spacing * 2,
    lineHeight: 32,
  },
  placeholderCard: {
    width: width - Spacing * 6,
    height: 300,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  placeholderText: {
    fontSize: FontSize.large,
    color: '#999',
    textAlign: 'center',
  },
  drawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing * 2,
    marginBottom: Spacing * 3,
    paddingVertical: Spacing * 1.5,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  drawButtonText: {
    fontSize: FontSize.large,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default GamesScreen;
