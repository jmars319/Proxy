import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { APP_NAME } from "@proxy/config";
import { defaultProfileDocument } from "@proxy/profiles";
import { runRewritePipeline } from "@proxy/rewrite-engine";

const profile = defaultProfileDocument.profile;
const preview = runRewritePipeline("  Mobile is scaffolded and ready for future activation  ", {
  profileTone: profile.tone,
  hardConstraints: profile.hardConstraints
});

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Future Surface</Text>
          <Text style={styles.title}>{APP_NAME} mobile scaffold</Text>
          <Text style={styles.body}>
            Mobile is present so the repo is standardized from day one, but the active product
            focus remains on desktop.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current profile</Text>
          <Text style={styles.cardBody}>{profile.metadata.name}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rewrite preview</Text>
          <Text style={styles.cardBody}>{preview.finalText}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Activation note</Text>
          <Text style={styles.cardBody}>
            Keep mobile thin until profile editing, local storage, and policy flows justify a full
            surface.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3eee6"
  },
  content: {
    padding: 24,
    gap: 16
  },
  hero: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#ffffff"
  },
  kicker: {
    color: "#6a7b6a",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase"
  },
  title: {
    marginTop: 12,
    fontSize: 34,
    fontWeight: "600",
    color: "#20272f"
  },
  body: {
    marginTop: 12,
    lineHeight: 24,
    color: "#5b6772",
    fontSize: 16
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.92)"
  },
  cardTitle: {
    color: "#6a7b6a",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.4
  },
  cardBody: {
    marginTop: 10,
    color: "#20272f",
    lineHeight: 24,
    fontSize: 16
  }
});
