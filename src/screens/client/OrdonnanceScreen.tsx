import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Camera, Plus, Check as Checkbox, CheckCheck as CheckboxChecked } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../contexts/CartContext';

type MedicationItem = {
  id: string;
  name: string;
  checked: boolean;
};

const MOCK_MEDICATIONS: MedicationItem[] = [
  { id: '1', name: 'Paracétamol 500mg', checked: false },
  { id: '2', name: 'Amoxicilline 250mg', checked: false },
  { id: '3', name: 'Vitamine C 1000mg', checked: false },
];

const OrdonnanceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { addItem } = useCart();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [showMedications, setShowMedications] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès à la caméra requis pour cette fonctionnalité');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setShowMedications(false);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
        setShowMedications(false);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const simulateAnalysis = async () => {
    setAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMedications(MOCK_MEDICATIONS);
      setShowMedications(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleToggleMedication = (id: string) => {
    setMedications(prev =>
      prev.map(m => (m.id === id ? { ...m, checked: !m.checked } : m))
    );
  };

  const handleAddToCart = () => {
    const selectedMeds = medications.filter(m => m.checked);
    if (selectedMeds.length === 0) {
      Alert.alert('Aucun médicament sélectionné', 'Veuillez cocher au moins un médicament');
      return;
    }

    selectedMeds.forEach(med => {
      addItem({
        product_id: med.id,
        product_name: med.name,
        brand: 'Ordonnance',
        price_xof: 2500,
        quantity: 1,
        image_url: null,
        requires_prescription: true,
        pharmacy_id: 'prescription-pharmacy',
        pharmacy_name: 'Pharmacie Ordonnance',
      });
    });

    Alert.alert('Succès', `${selectedMeds.length} médicament(s) ajouté(s) au panier`);
    setSelectedImage(null);
    setMedications([]);
    setShowMedications(false);
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setMedications([]);
    setShowMedications(false);
    setAnalyzing(false);
  };

  const renderMedicationItem = ({ item }: { item: MedicationItem }) => (
    <TouchableOpacity
      style={styles.medicationItem}
      onPress={() => handleToggleMedication(item.id)}
    >
      <View style={styles.medicationCheckbox}>
        {item.checked ? (
          <CheckboxChecked size={20} color="#2563eb" strokeWidth={2} />
        ) : (
          <Checkbox size={20} color="#cbd5e1" strokeWidth={2} />
        )}
      </View>
      <Text style={styles.medicationName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#2563eb" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner une Ordonnance</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Prenez en photo votre ordonnance. Notre système analysera automatiquement les médicaments.
          </Text>
        </View>

        {!selectedImage ? (
          <>
            <View style={styles.imageArea}>
              <Camera size={48} color="#94a3b8" strokeWidth={1.5} />
              <Text style={styles.placeholderText}>Prendre une photo de l'ordonnance</Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleTakePhoto}>
              <Camera size={20} color="#ffffff" strokeWidth={2} />
              <Text style={styles.primaryButtonText}>Prendre une photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handlePickFromGallery}>
              <Plus size={20} color="#2563eb" strokeWidth={2} />
              <Text style={styles.secondaryButtonText}>Choisir depuis la galerie</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />

            {!showMedications && !analyzing && (
              <TouchableOpacity style={styles.primaryButton} onPress={simulateAnalysis}>
                <Text style={styles.primaryButtonText}>Analyser l'ordonnance</Text>
              </TouchableOpacity>
            )}

            {analyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.analyzingText}>Analyse en cours...</Text>
              </View>
            )}

            {showMedications && (
              <>
                <View style={styles.medicationsContainer}>
                  <Text style={styles.medicationsTitle}>Médicaments détectés</Text>
                  <FlatList
                    data={medications}
                    renderItem={renderMedicationItem}
                    keyExtractor={item => item.id}
                    scrollEnabled={false}
                  />
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={handleAddToCart}>
                  <Text style={styles.primaryButtonText}>Ajouter au panier</Text>
                </TouchableOpacity>
              </>
            )}

            {showMedications && (
              <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
                <Text style={styles.retakeButtonText}>Reprendre une photo</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  infoBox: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  imageArea: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
  },
  selectedImage: {
    marginHorizontal: 16,
    marginVertical: 16,
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  analyzingContainer: {
    marginVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  analyzingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  medicationsContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  medicationsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  medicationCheckbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicationName: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  primaryButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  retakeButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
});

export default OrdonnanceScreen;
