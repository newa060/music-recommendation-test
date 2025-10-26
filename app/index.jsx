import { useRouter } from "expo-router";
import { Image,ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../assets/images/aatmabeat.png";

//const logo = require("../assets/images/Moodify.png");
export default function Index() {

  const router =useRouter();
  return (
    <SafeAreaView className={`bg-[#2b2b2b]`}>
      <StatusBar barStyle={"light-content"} backgroundColor={"#white"}/>
      <ScrollView contentContainerStyle={{height:"100%"}}>
        <View className="m-20 flex justify-center items-center">
          <Image source={logo} style={{width:400,height:100}}/>
      
        <View className="w-5/6">
        <TouchableOpacity onPress={()=>router.push("/signup")} className="p-2 my-9 bg-[#f49b33] text-black rounded-lg ">
          <Text className="text-xl font-sembold text-center">
            Sign Up
            </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>router.push("/home")} className="p-2 my-0 bg-[#2b2b2b] border border-[#f49b33]  rounded-lg max-w-fit">
          <Text className="text-lg font-sembold text-[#f49b33] text-center">
            Guest User
            </Text>
        </TouchableOpacity>
          </View>
          <View>
            <Text className="text-center text-base font-semibold my-4 text-white">
            <View className="border-b-2 border-[#f49b33] p-2 mb-1 w-24" /> or{" "} 
            <View className="border-b-2 border-[#f49b33] p-2 mb-1 w-24" />
            </Text>

            <TouchableOpacity 
            className="flex flex-row justify-center items-center"
            onPress={()=>router.push("/signin")}>  
              <Text className="text-white font-semibold">Already a User? {" "}</Text>
              <Text className="text-base font-sembold underline text-[#f49b33]">
                Sign in 
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        
      </ScrollView>
    </SafeAreaView>

  );
}
