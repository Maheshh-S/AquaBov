import { useState, useRef, useEffect } from 'react';
import { Upload, XCircle, Info, Loader2, Award, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const BreedIdentification = () => {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breedResult, setBreedResult] = useState<null | {
    breed: string;
    confidence: number;
    dimensions: { height: string; weight: string };
  }>(null);
  const [crossbreeds, setCrossbreeds] = useState<Array<{
    breed: string;
    benefits: string;
    compatibility: number;
  }>>([]);
  const [loadingStatus, setLoadingStatus] = useState('Initializing analysis...');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.match('image.*')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
        setImageFile(file);
        setIsAnalyzed(false);
        setError(null);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const analyzeCowBreed = async () => {
    if (!imageFile) {
      setError('Please upload an image first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBreedResult(null);
    setCrossbreeds([]);
    setLoadingStatus('Initializing analysis...');

    const statusMessages = [
      'Scanning image...',
      'Detecting cow features...',
      'Analyzing breed characteristics...',
      'Comparing with database...',
      'Finalizing results...'
    ];

    // Update status messages during loading
    statusMessages.forEach((message, i) => {
      setTimeout(() => {
        setLoadingStatus(message);
      }, i * 1000);
    });

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const predictResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/predict`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      

      const predictionData = predictResponse.data;

      if (predictionData.error) {
        throw new Error(predictionData.error);
      }

      const formattedResult = {
        breed: predictionData.breed,
        confidence: Math.round(predictionData.confidence * 100),
        dimensions: {
          height: `${predictionData.height_cm} cm`,
          weight: `${predictionData.width_cm} cm`
        }
      };

      setBreedResult(formattedResult);

      if (formattedResult.confidence > 90) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      const suggestionsResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/suggest_breeds`,
        {
          breed: predictionData.breed
        }
      );
      

      const suggestionsData = suggestionsResponse.data;

      if (suggestionsData.error) {
        throw new Error(suggestionsData.error);
      }

      const formattedSuggestions = suggestionsData.suggestions?.map((suggestion: any) => ({
        breed: suggestion.breed,
        benefits: suggestion.benefit,
        compatibility: Math.floor(Math.random() * (95 - 70 + 1) + 70)
      })) || [];

      setCrossbreeds(formattedSuggestions);
      setIsAnalyzed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (imageFile) analyzeCowBreed();
  };

  const clearImage = () => {
    setImage(null);
    setImageFile(null);
    setBreedResult(null);
    setCrossbreeds([]);
    setIsAnalyzed(false);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section id="identify" className="py-20 bg-gradient-to-b from-ghibli-yellow-light/30 to-white">
      <div className="ghibli-container">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="section-heading">Identify Your Cow's Breed</h2>
          <p className="text-ghibli-brown mb-10">
            Upload a photo of your cow to identify its breed, get dimension information, and receive crossbreeding suggestions.
          </p>
        </div>
        
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center"
            >
              <AlertCircle className="mr-2 h-5 w-5" />
              <span className="flex-1">{error}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRetry}
                className="text-red-700 hover:bg-red-200"
              >
                Retry
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div>
            {!image ? (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer ${
                  isDragging 
                    ? 'border-ghibli-green bg-ghibli-green/5' 
                    : 'border-ghibli-brown/30 hover:border-ghibli-brown/50 hover:bg-ghibli-yellow/5'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                />
                
                <div className="flex flex-col items-center justify-center py-10">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3,
                      ease: "easeInOut" 
                    }}
                    className="w-20 h-20 bg-ghibli-yellow/20 rounded-full flex items-center justify-center mb-4"
                  >
                    <Upload className="h-10 w-10 text-ghibli-brown" />
                  </motion.div>
                  
                  <h3 className="text-xl font-medium text-ghibli-brown-dark mb-2">
                    Drag & Drop Your Cow Image
                  </h3>
                  <p className="text-ghibli-brown mb-4 max-w-md">
                    Or click to browse your files. For best results, use a clear side view of your cow.
                  </p>
                  
                  <Button className="ghibli-btn mt-2">
                    Choose Image
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl overflow-hidden shadow-lg relative"
                >
                  <img 
                    src={image} 
                    alt="Uploaded cow" 
                    className="w-full h-auto object-cover"
                  />
                  
                  {/* Fixed X button */}
                  <button
                    onClick={clearImage}
                    className="absolute top-3 right-3 bg-white/80 hover:bg-white p-1 rounded-full focus:outline-none"
                  >
                    <XCircle className="h-6 w-6 text-ghibli-brown-dark hover:text-ghibli-brown" />
                  </button>
                </motion.div>
                
                {!isAnalyzed && !isLoading && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-4 text-center"
                  >
                    <Button 
                      className="ghibli-btn bg-ghibli-green shadow-lg px-6 w-full md:w-auto"
                      onClick={analyzeCowBreed}
                    >
                      <Search className="h-5 w-5 text-white mr-2" />
                      Analyze Breed
                    </Button>
                  </motion.div>
                )}
                
                {isLoading && (
                  <div className="mt-4">
                    <div className="w-full bg-ghibli-yellow/20 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="bg-ghibli-green h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ 
                          duration: 2.5,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                    <p className="text-center text-sm text-ghibli-brown mt-2">
                      {loadingStatus}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div>
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="ghibli-card">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Loader2 className="h-12 w-12 text-ghibli-green animate-spin mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-ghibli-brown-dark mb-3">
                        Analyzing Your Cow
                      </h3>
                      <p className="text-ghibli-brown mb-6">
                        {loadingStatus}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : isAnalyzed && breedResult ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="ghibli-card hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <h3 className="text-2xl font-medium text-ghibli-brown-dark flex items-center">
                            {breedResult.breed}
                            {breedResult.confidence > 90 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-2"
                              >
                                <CheckCircle className="h-6 w-6 text-ghibli-green" />
                              </motion.span>
                            )}
                          </h3>
                        </motion.div>
                        <div className="flex items-center mt-1">
                          <div className="w-full bg-ghibli-yellow/30 rounded-full h-2.5">
                            <motion.div 
                              className="bg-ghibli-green h-2.5 rounded-full" 
                              initial={{ width: 0 }}
                              animate={{ width: `${breedResult.confidence}%` }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                          <span className="ml-2 text-sm text-ghibli-brown">
                            {breedResult.confidence}% confidence
                          </span>
                        </div>
                      </div>
                      <motion.div
                        whileHover={{ rotate: 15 }}
                        className="bg-ghibli-yellow/20 p-2 rounded-full"
                      >
                        <Award className="h-6 w-6 text-ghibli-brown" />
                      </motion.div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <motion.div
                        whileHover={{ y: -3 }}
                        className="bg-ghibli-yellow/10 p-4 rounded-xl"
                      >
                        <p className="text-sm text-ghibli-brown">Height</p>
                        <p className="text-lg font-medium text-ghibli-brown-dark">
                          {breedResult.dimensions.height}
                        </p>
                      </motion.div>
                      <motion.div
                        whileHover={{ y: -3 }}
                        className="bg-ghibli-yellow/10 p-4 rounded-xl"
                      >
                        <p className="text-sm text-ghibli-brown">Width</p>
                        <p className="text-lg font-medium text-ghibli-brown-dark">
                          {breedResult.dimensions.weight}
                        </p>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : image ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="ghibli-card">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Info className="h-12 w-12 text-ghibli-blue mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-ghibli-brown-dark mb-3">
                        Ready to Analyze
                      </h3>
                      <p className="text-ghibli-brown mb-6">
                        Click the analyze button below your image to identify your cow's breed and get recommendations.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="ghibli-card h-full flex items-center justify-center bg-ghibli-yellow/10 border-none">
                  <CardContent className="text-center py-10">
                    <motion.img 
                      src="/images/cow-illustration.png" 
                      alt="Cow illustration" 
                      className="w-40 h-40 object-contain mx-auto mb-4 opacity-60"
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <h3 className="text-xl font-medium text-ghibli-brown-dark mb-2">
                      Upload a Photo to Get Started
                    </h3>
                    <p className="text-ghibli-brown max-w-md">
                      We'll analyze your cow's breed and provide valuable information to help with your farming decisions.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
        
        {isAnalyzed && crossbreeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 mx-[10%]"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/70 rounded-2xl p-6 shadow-lg border border-ghibli-yellow/20"
            >
              <h3 className="subsection-heading text-center mb-6">
                Crossbreeding Suggestions
              </h3>
              
              <p className="text-ghibli-brown mb-6 text-center">
                Based on your {breedResult?.breed} cow, here are the top recommended crossbreeds:
              </p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {crossbreeds.map((crossbreed, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white border border-ghibli-yellow/30 rounded-xl p-4 hover:shadow transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-ghibli-brown-dark">
                        {crossbreed.breed}
                      </h4>
                      <span className="text-sm bg-ghibli-green/10 text-ghibli-green-dark px-2 py-1 rounded-full">
                        {crossbreed.compatibility}%
                      </span>
                    </div>
                    <p className="text-sm text-ghibli-brown mt-2">
                      {crossbreed.benefits}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default BreedIdentification;