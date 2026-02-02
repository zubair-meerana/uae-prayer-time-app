import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import { LanguageProvider } from './src/context/LanguageContext';

export default function App() {
    return (
        <LanguageProvider>
            <View style={styles.container}>
                <HomeScreen />
                <StatusBar style="dark" />
            </View>
        </LanguageProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5', // Matched with screen bg
    },
});
