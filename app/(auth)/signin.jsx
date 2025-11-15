import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Formik } from 'formik';
import { useState, useEffect } from 'react';
import { Image, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/aatmabeat.png";
import validationSchema from '../../utils/authSchema';
import { useMusic } from '../../context/MusicContext'; // make sure path is correct


const Signup = () => {
    const router = useRouter();
    const { stopMusic } = useMusic(); // get stopMusic from context
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    
     useEffect(() => {
        stopMusic(); // stop any playing music when this screen opens
    }, []);

    const handleSignin = async (values) => {
        setIsLoading(true);
        try {
            const response = await fetch("http://192.168.18.240:3000/signin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: values.email,
                    password: values.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                await AsyncStorage.setItem("user", JSON.stringify(data.user));
                alert("Login successful!");
                router.push("/home");
            } else {
                alert(data.message || "Invalid email or password");
            }
        } catch (error) {
            console.error("Signin error:", error);
            alert("Error connecting to server");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
            <ScrollView 
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image 
                                source={logo} 
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>Welcome Back</Text>
                        
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <Formik
                            initialValues={{ email: "", password: "" }}
                            validationSchema={validationSchema}
                            onSubmit={handleSignin}
                        >
                            {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                                <View style={styles.form}>
                                    {/* Email Input */}
                                    <View style={styles.inputContainer}>
                                        <View style={styles.inputLabel}>
                                            <Ionicons name="mail-outline" size={16} color="#6C63FF" />
                                            <Text style={styles.labelText}>Email Address</Text>
                                        </View>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                touched.email && errors.email ? styles.inputError : null
                                            ]}
                                            placeholder="Enter your email"
                                            placeholderTextColor="#666"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            onChangeText={handleChange("email")}
                                            onBlur={handleBlur("email")}
                                            value={values.email}
                                        />
                                        {touched.email && errors.email && (
                                            <Text style={styles.errorText}>{errors.email}</Text>
                                        )}
                                    </View>

                                    {/* Password Input */}
                                    <View style={styles.inputContainer}>
                                        <View style={styles.inputLabel}>
                                            <Ionicons name="lock-closed-outline" size={16} color="#6C63FF" />
                                            <Text style={styles.labelText}>Password</Text>
                                        </View>
                                        <View style={styles.passwordContainer}>
                                            <TextInput
                                                style={[
                                                    styles.input,
                                                    styles.passwordInput,
                                                    touched.password && errors.password ? styles.inputError : null
                                                ]}
                                                placeholder="Enter your password"
                                                placeholderTextColor="#666"
                                                secureTextEntry={!showPassword}
                                                autoCapitalize="none"
                                                onChangeText={handleChange("password")}
                                                onBlur={handleBlur("password")}
                                                value={values.password}
                                            />
                                            <TouchableOpacity 
                                                style={styles.eyeIcon}
                                                onPress={() => setShowPassword(!showPassword)}
                                            >
                                                <Ionicons 
                                                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                                    size={20} 
                                                    color="#666" 
                                                />
                                            </TouchableOpacity>
                                        </View>
                                        {touched.password && errors.password && (
                                            <Text style={styles.errorText}>{errors.password}</Text>
                                        )}
                                    </View>

                                    {/* Sign In Button */}
                                    <TouchableOpacity 
                                        style={[
                                            styles.signInButton,
                                            isLoading && styles.signInButtonDisabled
                                        ]}
                                        onPress={handleSubmit}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <View style={styles.loadingContainer}>
                                                <Ionicons name="refresh" size={20} color="#fff" />
                                                <Text style={styles.signInButtonText}>Signing In...</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.buttonContent}>
                                                <Ionicons name="log-in-outline" size={20} color="#fff" />
                                                <Text style={styles.signInButtonText}>Sign In</Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </Formik>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Alternative Options */}
                        <View style={styles.alternativeOptions}>
                            {/* Guest Access */}
                            <TouchableOpacity 
                                style={styles.guestButton}
                                onPress={() => router.push("/home")}
                            >
                                <View style={styles.guestIcon}>
                                    <MaterialIcons name="person-outline" size={20} color="#6C63FF" />
                                </View>
                                <Text style={styles.guestButtonText}>Continue as Guest</Text>
                            </TouchableOpacity>

                            {/* Sign Up Link */}
                            <View style={styles.signUpContainer}>
                                <Text style={styles.signUpText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => router.push("/signup")}>
                                    <Text style={styles.signUpLink}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = {
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 30,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logo: {
        width: 350,  // Increased from 280
        height: 120, // Increased from 80
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
    },
    formContainer: {
        flex: 1,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelText: {
        color: '#6C63FF',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    input: {
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: '#fff',
        fontSize: 16,
    },
    inputError: {
        borderColor: '#FF6B6B',
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 14,
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 12,
        marginTop: 6,
        marginLeft: 4,
    },
    signInButton: {
        backgroundColor: '#6C63FF',
        borderRadius: 16,
        paddingVertical: 16,
        marginTop: 20,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    signInButtonDisabled: {
        opacity: 0.7,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    signInButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#2A2A2A',
    },
    dividerText: {
        color: '#666',
        fontSize: 14,
        marginHorizontal: 12,
    },
    alternativeOptions: {
        alignItems: 'center',
    },
    guestButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 14,
        marginBottom: 24,
        width: '100%',
        justifyContent: 'center',
    },
    guestIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(108, 99, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    guestButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    signUpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    signUpText: {
        color: '#888',
        fontSize: 14,
    },
    signUpLink: {
        color: '#6C63FF',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
    },
    footerText: {
        color: '#666',
        fontSize: 12,
        fontStyle: 'italic',
        letterSpacing: 0.5,
    },
};

export default Signup;