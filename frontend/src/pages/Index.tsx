
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BreedIdentification from "@/components/BreedIdentification";
import ChatSupport from "@/components/ChatSupport";
import NutritionPlan from "@/components/NutritionPlan";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <BreedIdentification />
      <ChatSupport />
      <NutritionPlan />
      <Footer />
    </div>
  );
};

export default Index;
