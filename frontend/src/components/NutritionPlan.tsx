import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { X, Loader2, Leaf, Wheat, Droplets, Apple, Download, Upload } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import axios from 'axios';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface NutritionItem {
  type: string;
  name: string;
  amount: string;
  description: string;
  icon: JSX.Element;
  color: string;
}

interface NutritionPlanResponse {
  success: boolean;
  plan?: {
    forage: {
      name: string;
      amount: string;
      description: string;
    };
    grain: {
      name: string;
      amount: string;
      description: string;
    };
    liquid: {
      name: string;
      amount: string;
      description: string;
    };
    supplement: {
      name: string;
      amount: string;
      description: string;
    };
  };
  breed?: string;
  error?: string;
}

const NutritionPlan = ({ breed: initialBreed }: { breed: string | null }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionItem[]>([]);
  const [weatherInfo, setWeatherInfo] = useState('');
  const [breed, setBreed] = useState<string | null>(initialBreed);
  const [file, setFile] = useState<File | null>(null);
  const [isDetectingBreed, setIsDetectingBreed] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @page { 
        size: auto;  
        margin: 20mm;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
        }
        .print-hidden {
          display: none;
        }
      }
    `,
    documentTitle: `nutrition-plan-${breed || 'cow'}`,
  });

  const nutritionCategories = [
    {
      type: 'Forage',
      icon: <Leaf className="h-5 w-5" />,
      color: 'text-ghibli-green bg-ghibli-green/20'
    },
    {
      type: 'Grain',
      icon: <Wheat className="h-5 w-5" />,
      color: 'text-ghibli-brown bg-ghibli-brown/20'
    },
    {
      type: 'Liquid',
      icon: <Droplets className="h-5 w-5" />,
      color: 'text-ghibli-blue bg-ghibli-blue/20'
    },
    {
      type: 'Supplement',
      icon: <Apple className="h-5 w-5" />,
      color: 'text-ghibli-yellow-dark bg-ghibli-yellow/20'
    }
  ];

  const detectBreed = async () => {
    if (!file) return;
    
    setIsDetectingBreed(true);
    setApiError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/predict`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 10000
        }
      );
      

      if (response.data.breed) {
        setBreed(response.data.breed);
      } else {
        setApiError(response.data.message || 'Could not detect breed. Please try another image.');
      }
    } catch (error) {
      console.error("Error detecting breed:", error);
      setApiError('Failed to detect breed. Please try again.');
    } finally {
      setIsDetectingBreed(false);
    }
  };

  const fetchNutritionPlan = async () => {
    if (!breed) return;
    
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await axios.post<NutritionPlanResponse>(
        `${import.meta.env.VITE_API_URL}/nutrition`, 
        { breed: breed },
        { timeout: 10000 }
      );
      

      if (response.data.success && response.data.plan) {
        const { forage, grain, liquid, supplement } = response.data.plan;
        
        setNutritionPlan([
          {
            type: 'Forage',
            name: forage.name || 'Premium Alfalfa Hay',
            amount: forage.amount || '12-15 kg/day',
            description: forage.description || 'High-quality forage for digestive health',
            icon: nutritionCategories[0].icon,
            color: nutritionCategories[0].color
          },
          {
            type: 'Grain',
            name: grain.name || 'Mixed Grain Feed',
            amount: grain.amount || '8-10 kg/day',
            description: grain.description || 'Balanced grain mix for energy',
            icon: nutritionCategories[1].icon,
            color: nutritionCategories[1].color
          },
          {
            type: 'Liquid',
            name: liquid.name || 'Fresh Water',
            amount: liquid.amount || '80-110 liters/day',
            description: liquid.description || 'Clean water essential for health',
            icon: nutritionCategories[2].icon,
            color: nutritionCategories[2].color
          },
          {
            type: 'Supplement',
            name: supplement.name || 'Mineral Mix',
            amount: supplement.amount || '150-200 g/day',
            description: supplement.description || 'Essential minerals and vitamins',
            icon: nutritionCategories[3].icon,
            color: nutritionCategories[3].color
          }
        ]);
        
        setWeatherInfo('Current weather: Sunny, 25°C (mock data)');
      } else {
        throw new Error(response.data.error || 'Failed to fetch nutrition plan');
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setApiError('Failed to load custom nutrition plan. Showing default recommendations.');
      setNutritionPlan(getDefaultPlan());
      setWeatherInfo('Weather data unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultPlan = (): NutritionItem[] => {
    return nutritionCategories.map((category, index) => ({
      type: category.type,
      name: category.type === 'Forage' ? 'Premium Alfalfa Hay' : 
            category.type === 'Grain' ? 'Mixed Grain Feed' :
            category.type === 'Liquid' ? 'Fresh Water' : 'Mineral Mix',
      amount: category.type === 'Forage' ? '12-15 kg/day' : 
              category.type === 'Grain' ? '8-10 kg/day' :
              category.type === 'Liquid' ? '80-110 liters/day' : '150-200 g/day',
      description: category.type === 'Forage' ? 'High-quality forage for digestive health' :
                  category.type === 'Grain' ? 'Balanced grain mix for energy' :
                  category.type === 'Liquid' ? 'Clean water essential for health' : 
                  'Essential minerals and vitamins',
      icon: category.icon,
      color: category.color
    }));
  };

  const handleDialogOpen = (open: boolean) => {
    if (open && breed) {
      fetchNutritionPlan();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setApiError(null);
    }
  };

  const renderNutritionPlanContent = () => (
    <div className="mt-6 space-y-6 print-hidden">
      {weatherInfo && (
        <div className="bg-white/90 rounded-lg p-3 text-sm text-ghibli-brown-dark mb-4 shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <span className="font-medium">🌤️ {weatherInfo}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nutritionPlan.map((item, index) => (
          <div 
            key={index} 
            className="bg-white/90 backdrop-blur-sm rounded-xl p-5 flex flex-col gap-3 shadow-md border border-ghibli-yellow/10 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <h4 className="font-bold text-lg text-ghibli-brown-dark">
                  {item.name}
                </h4>
                <Badge variant="outline" className={`mt-1 ${item.color.replace('text-', 'text-')}`}>
                  {item.type}
                </Badge>
              </div>
            </div>
            <div className="mt-2">
              <p className="font-semibold text-ghibli-green-dark">
                Amount: <span className="font-normal text-ghibli-brown">{item.amount}</span>
              </p>
              <p className="text-sm text-ghibli-brown mt-2">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-ghibli-yellow/10 rounded-xl p-4 mt-4 border border-ghibli-yellow/20">
        <p className="text-sm text-ghibli-brown-dark">
          <strong>📝 Note:</strong> This plan should be adjusted based on your cow's age, weight, production level, and season. Always ensure fresh water is available at all times.
          <span className="text-red-700 font-bold block mt-2">We are working to make the plans more accurate and real-time. Stay tuned!</span>
        </p>
      </div>
    </div>
  );

  return (
    <section id="nutrition" className="py-20 bg-gradient-to-b from-ghibli-blue/10 to-white">
      <div className="ghibli-container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-ghibli-brown-dark mb-4">Customized Nutrition Plan</h2>
          <p className="text-lg text-ghibli-brown">
            Get a detailed feeding plan tailored to your cow's breed and specific needs.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto text-center">
          {apiError && (
            <Alert variant="destructive" className="mb-6">
              <X className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          
          <Dialog onOpenChange={handleDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="ghibli-btn bg-ghibli-green hover:bg-ghibli-green-dark text-lg py-6 px-8 rounded-full shadow-lg transition-all hover:scale-105"
                disabled={isDetectingBreed}
              >
                {breed ? (
                  <>
                    <Leaf className="mr-2 h-5 w-5" />
                    View <span className="text-red-600">{breed}</span> Nutrition Plan
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-5 w-5" />
                    Get Nutrition Plan
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-2xl border-ghibli-yellow/20 shadow-xl max-h-[90vh]">
              <div className="bg-gradient-to-b from-ghibli-green/20 to-ghibli-yellow/10 px-6 py-8 max-h-[80vh] overflow-y-auto">
                {/* Printable content */}
                <div ref={printRef} className="print:p-6">
                  {breed && (
                    <>
                      <div className="hidden print:block">
                        <h1 className="text-3xl font-bold text-ghibli-brown-dark text-center">
                          <span className="text-red-600">{breed}</span> Nutrition Plan
                        </h1>
                        <p className="text-ghibli-brown text-center mt-2">
                          Custom feeding recommendations for optimal health
                        </p>
                      </div>
                      
                      {!isLoading && (
                        <>
                          {weatherInfo && (
                            <div className="bg-white/90 rounded-lg p-3 text-sm text-ghibli-brown-dark mb-4 shadow-sm print:block">
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-medium">🌤️ {weatherInfo}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:block">
                            {nutritionPlan.map((item, index) => (
                              <div 
                                key={index} 
                                className="bg-white/90 rounded-xl p-5 flex flex-col gap-3 shadow-md border border-ghibli-yellow/10 print:break-inside-avoid"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`rounded-full p-2 ${item.color}`}>
                                    {item.icon}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-lg text-ghibli-brown-dark">
                                      {item.name}
                                    </h4>
                                    <Badge variant="outline" className={`mt-1 ${item.color.replace('text-', 'text-')}`}>
                                      {item.type}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <p className="font-semibold text-ghibli-green-dark">
                                    Amount: <span className="font-normal text-ghibli-brown">{item.amount}</span>
                                  </p>
                                  <p className="text-sm text-ghibli-brown mt-2">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-ghibli-yellow/10 rounded-xl p-4 mt-4 border border-ghibli-yellow/20 print:block">
                            <p className="text-sm text-ghibli-brown-dark">
                              <strong>📝 Note:</strong> This plan should be adjusted based on your cow's age, weight, production level, and season. Always ensure fresh water is available at all times.
                              <span className="text-red-700 font-bold block mt-2">We are working to make the plans more accurate and real-time. Stay tuned!</span>
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
                
                {/* Visible content */}
                <div className="print-hidden">
                  {breed ? (
                    <>
                      <DialogHeader className="text-center">
                        <DialogTitle className="text-3xl font-bold text-ghibli-brown-dark">
                          <span className="text-red-600">{breed}</span> Nutrition Plan
                        </DialogTitle>
                        <div className="text-ghibli-brown mt-2">
                          Custom feeding recommendations for optimal health
                        </div>
                      </DialogHeader>
                      
                      {isLoading ? (
                        <div className="py-16 flex flex-col items-center">
                          <Loader2 className="h-12 w-12 text-ghibli-green animate-spin mb-4" />
                          <p className="text-ghibli-brown-dark text-lg mb-4">
                            Creating Your Custom Plan
                          </p>
                          <Progress value={65} className="w-48 h-2 bg-white/50" />
                          <p className="text-sm text-ghibli-brown mt-4">
                            Analyzing <span className="text-red-600">{breed}</span> characteristics and current conditions...
                          </p>
                        </div>
                      ) : (
                        <>
                          {renderNutritionPlanContent()}
                          <div className="text-center mt-6 pt-4 pb-6">
                            <Button 
                              onClick={() => {
                                handlePrint();
                              }}
                              className="ghibli-btn bg-ghibli-green hover:bg-ghibli-green-dark px-8 py-6 text-lg shadow-md"
                            >
                              <Download className="mr-2 h-5 w-5" />
                              Download Nutrition Plan PDF
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="py-8 px-6 print-hidden">
                      <DialogHeader className="text-center">
                        <DialogTitle className="text-2xl font-bold text-ghibli-brown-dark">
                          Detect Your Cow's Breed
                        </DialogTitle>
                        <div className="text-ghibli-brown mt-2">
                          Upload an image to get customized recommendations
                          <span className="text-red-700 font-bold block">
                            We are working to make the plans more accurate and real-time. Stay tuned!  
                            <span className="text-green-600 block">
                              If it's not generating, please click the <strong>X</strong> (close button) at the top right and try again.
                            </span>
                          </span>
                        </div>
                      </DialogHeader>
                      
                      <div className="mt-6 space-y-6">
                        <Alert className="bg-ghibli-yellow/20 border-ghibli-yellow/30">
                          <Leaf className="h-5 w-5" />
                          <AlertTitle className="font-medium">Breed Detection Required</AlertTitle>
                          <AlertDescription>
                            Please upload a clear image of your cow to detect its breed and get a customized nutrition plan.
                          </AlertDescription>
                        </Alert>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-ghibli-green/30 border-dashed rounded-xl cursor-pointer bg-white/80 hover:bg-white/90 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                                <Upload className="w-10 h-10 mb-3 text-ghibli-green" />
                                <p className="mb-2 text-sm text-ghibli-brown">
                                  <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-ghibli-brown/70">
                                  PNG, JPG, JPEG (MAX. 5MB)
                                </p>
                              </div>
                              <input 
                                id="dropzone-file" 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                            </label>
                          </div>
                          
                          {file && (
                            <div className="bg-white/90 rounded-lg p-3 flex items-center justify-between shadow-sm">
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={URL.createObjectURL(file)} 
                                  alt="Preview" 
                                  className="h-12 w-12 object-cover rounded-lg"
                                />
                                <div>
                                  <p className="text-sm font-medium text-ghibli-brown-dark truncate max-w-xs">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-ghibli-brown/70">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <button 
                                onClick={() => setFile(null)}
                                className="text-ghibli-brown/50 hover:text-ghibli-brown transition-colors"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <Button
                          onClick={detectBreed}
                          disabled={!file || isDetectingBreed}
                          className="w-full ghibli-btn bg-ghibli-green hover:bg-ghibli-green-dark py-6 text-lg transition-all hover:scale-[1.02]"
                        >
                          {isDetectingBreed ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Detecting Breed...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-5 w-5" />
                              Detect Breed and Get Plan
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <p className="mt-6 text-lg text-ghibli-brown-dark">
            {breed 
              ? `✨ Our AI has analyzed your ${breed} and created a specialized nutrition plan.`
              : '📷 Upload a cow image to analyze and get customized feeding recommendations.'}
            <span className="text-red-700 font-bold block">We are working to make the plans more accurate and real-time. Stay tuned!</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default NutritionPlan;