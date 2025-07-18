import React from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { SafeAreaView, View } from "react-native";
import { ChatbotScreen } from "../screens/chatbot/chatbotScreen";
import { CounterScreen } from "../screens/counter/counterScreen";
import { ThemeToggleButton } from "../components/ThemeToggleButton";
import { useTheme } from "../theme";
import { Ionicons } from "@expo/vector-icons";

const Drawer = createDrawerNavigator();

export const DrawerNavigator = () => {
  const { colors } = useTheme();

  return (
    <Drawer.Navigator
      initialRouteName="Chatbot"
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerStyle: {
          backgroundColor: colors.background,
          width: 280,
        },
      }}
      drawerContent={(props) => (
        <View style={{ flex: 1, marginBottom: 30 }}>
          <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
          </DrawerContentScrollView>
          <ThemeToggleButton />
        </View>
      )}
    >
      <Drawer.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{
          drawerLabel: "Chatbot",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Counter"
        component={CounterScreen}
        options={{
          drawerLabel: "Counter",
          drawerIcon: ({ color, size }) => (
            <Ionicons name="calculator" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};
