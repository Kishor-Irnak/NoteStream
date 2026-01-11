import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from './services/geminiService';
import { AppState, AnalysisResult, FileData, ChatMessage, NoteItem } from './types';
import { 
  Upload, 
  FileText, 
  MoreVertical, 
  Search, 
  PanelLeft, 
  Play,
  Volume2, 
  Plus, 
  Sparkles,
  Layout,
  Pause,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Info,
  MessageCircle,
  X
} from 'lucide-react';
import MemoryMap from './components/MemoryMap';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  
  // Real Data State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState<NoteItem[]>([]);
  const [loadingNoteType, setLoadingNoteType] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    // Auto scroll to bottom of chat
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setAppState(AppState.PROCESSING);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64String = e.target?.result as string;
      const base64Content = base64String.split(',')[1];
      
      setFileData({
        name: file.name,
        size: file.size,
        type: file.type,
        base64: base64Content
      });

      try {
        const result = await GeminiService.processFile(base64Content, file.type);
        setAnalysisResult(result);
        setAppState(AppState.ANALYZED);
      } catch (error) {
        console.error("Error processing file", error);
        setAppState(AppState.ERROR);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !fileData) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const responseText = await GeminiService.chatWithDocument(
        fileData.base64,
        fileData.type,
        chatHistory,
        userMsg.text
      );
      
      const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: new Date() };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat failed", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateNote = async (type: string) => {
    if (!fileData) return;
    setLoadingNoteType(type);

    try {
      const newNote = await GeminiService.generateNote(fileData.base64, fileData.type, type);
      setGeneratedNotes(prev => [newNote, ...prev]);
      setActiveNote(newNote); // Automatically open the new note
    } catch (error) {
      console.error(`Failed to generate ${type}`, error);
    } finally {
      setLoadingNoteType(null);
    }
  };

  const toggleSpeech = () => {
    if (!analysisResult?.summary) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(analysisResult.summary);
      utterance.onend = () => setIsPlaying(false);
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const triggerFileUpload = () => fileInputRef.current?.click();

  const getSourceIconColor = (index: number) => {
      const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600'];
      return colors[index % colors.length];
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-gray-900 font-sans overflow-hidden">
      
      {/* 1. LEFT SIDEBAR - SOURCES */}
      <aside className="w-[280px] border-r border-gray-200 flex flex-col bg-[#F9FAFB] z-20 shrink-0 hidden md:flex">
        <div className="h-16 flex items-center justify-between px-4">
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold transform -rotate-12">N</span>
             </div>
             <span className="font-semibold text-gray-900 tracking-tight">NoteStream</span>
           </div>
        </div>

        <div className="p-4 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-sm font-medium text-gray-900">Sources</h2>
             <div className="flex gap-2">
                <button className="p-1 hover:bg-gray-200 rounded"><Search className="w-4 h-4 text-gray-500" /></button>
                <button className="p-1 hover:bg-gray-200 rounded"><PanelLeft className="w-4 h-4 text-gray-500" /></button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
             <button 
               onClick={triggerFileUpload}
               className="w-full py-2.5 px-3 border border-gray-200 rounded-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:bg-white hover:shadow-sm transition-all mb-4 bg-transparent border-dashed"
             >
                <Plus className="w-4 h-4" /> Add source
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />

             {fileData && (
                <div className="flex items-center gap-3 p-2.5 bg-white border border-gray-200 shadow-sm rounded-lg cursor-pointer group transition-all">
                   <div className="p-1.5 bg-red-50 rounded text-red-600">
                      <FileText className="w-3.5 h-3.5" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{fileData.name}</p>
                      <p className="text-[10px] text-gray-400">PDF • {(fileData.size / 1024 / 1024).toFixed(1)} MB</p>
                   </div>
                   <input type="checkbox" checked readOnly className="rounded border-gray-300 text-black focus:ring-black" />
                </div>
             )}

             {analysisResult && analysisResult.sources.map((source, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 rounded-lg cursor-pointer group transition-all">
                   <div className={`p-1.5 rounded ${getSourceIconColor(i)}`}>
                       <FileText className="w-3.5 h-3.5" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900">{source.title}</p>
                   </div>
                   <input type="checkbox" checked readOnly className="opacity-0 group-hover:opacity-100 rounded border-gray-300 text-black focus:ring-black" />
                </div>
             ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
             <div className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 cursor-pointer">
                 <input type="checkbox" className="rounded border-gray-300" />
                 <span>Select all sources</span>
             </div>
          </div>
        </div>
      </aside>

      {/* 2. CENTER PANEL - MAIN CHAT & CONTENT */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden relative shadow-xl shadow-gray-200/50 z-10 m-0 md:m-2 md:rounded-2xl border border-gray-200">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-100 flex-shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-50 to-purple-50 border border-gray-100 flex items-center justify-center">
                 <Sparkles className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h1 className="text-base font-medium text-gray-900 leading-none">
                    {fileData ? fileData.name.replace('.pdf', '') : 'New Notebook'}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                    {analysisResult ? `${analysisResult.sources.length} sources` : '0 sources'} • Just now
                </p>
              </div>
           </div>
           
           <button onClick={() => window.scrollTo(0,0)} className="px-3 py-1.5 rounded-full bg-gray-50 text-xs font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1.5 transition-colors">
              Jump to top
           </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32">
           
           {/* IDLE STATE */}
           {appState === AppState.IDLE && (
              <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto animate-fade-in-up">
                 <div className="w-20 h-20 mb-6 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 rotate-3">
                    <Upload className="w-8 h-8 text-gray-400" />
                 </div>
                 <h2 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">Add a source to begin</h2>
                 <p className="text-gray-500 mb-8 leading-relaxed">
                    Upload a PDF to generate a comprehensive study guide, audio overview, and interactive memory map.
                 </p>
                 <button onClick={triggerFileUpload} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-gray-200">
                    <Plus className="w-4 h-4" /> Add source
                 </button>
              </div>
           )}

           {/* PROCESSING STATE */}
           {appState === AppState.PROCESSING && (
              <div className="flex flex-col items-center justify-center h-full">
                 <div className="relative w-16 h-16 mb-6">
                     <div className="absolute w-full h-full border-4 border-gray-100 rounded-full"></div>
                     <div className="absolute w-full h-full border-4 border-gray-900 rounded-full border-t-transparent animate-spin"></div>
                 </div>
                 <p className="text-gray-900 font-medium">Reading document...</p>
                 <p className="text-gray-400 text-sm mt-1">Generating summary and knowledge graph</p>
              </div>
           )}

           {/* ANALYZED STATE */}
           {appState === AppState.ANALYZED && analysisResult && (
              <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
                 
                 {/* Summary Section */}
                 <div>
                    <p className="text-sm text-gray-400 mb-2 font-medium uppercase tracking-wider">Analysis</p>
                    <div className="bg-white rounded-xl">
                       <p className="text-gray-800 leading-relaxed text-[17px] font-light">
                           {analysisResult.summary}
                       </p>
                       <div className="flex items-center gap-4 mt-6">
                           <div className="flex gap-1">
                               <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><RefreshCw className="w-4 h-4" /></button>
                               <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><ThumbsUp className="w-4 h-4" /></button>
                               <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"><ThumbsDown className="w-4 h-4" /></button>
                           </div>
                       </div>
                    </div>
                 </div>

                 {/* Memory Map */}
                 <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm text-gray-400 font-medium uppercase tracking-wider">Concept Map</h3>
                    </div>
                    <MemoryMap data={analysisResult.memoryMap} />
                 </div>

                 {/* Chat History Section */}
                 {chatHistory.length > 0 && (
                   <div className="pt-6 border-t border-gray-100">
                      <p className="text-sm text-gray-400 mb-4 font-medium uppercase tracking-wider">Conversation</p>
                      <div className="space-y-6">
                        {chatHistory.map((msg, idx) => (
                           <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-50 to-purple-50 flex items-center justify-center border border-gray-100 shrink-0">
                                   <Sparkles className="w-4 h-4 text-blue-500" />
                                </div>
                              )}
                              <div className={`py-3 px-5 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                                 msg.role === 'user' 
                                 ? 'bg-gray-100 text-gray-900 rounded-tr-sm' 
                                 : 'bg-white border border-gray-200 text-gray-800 shadow-sm rounded-tl-sm'
                              }`}>
                                 {msg.text}
                              </div>
                           </div>
                        ))}
                        {isChatLoading && (
                           <div className="flex gap-4">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-50 to-purple-50 flex items-center justify-center border border-gray-100 shrink-0">
                                   <Sparkles className="w-4 h-4 text-blue-500" />
                                </div>
                              <div className="bg-white border border-gray-200 py-3 px-5 rounded-2xl rounded-tl-sm shadow-sm flex gap-2 items-center">
                                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                 <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                              </div>
                           </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                   </div>
                 )}

              </div>
           )}
        </div>

        {/* Chat / Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
           <div className="max-w-3xl mx-auto">
              
              {/* Suggestion Chips */}
              {appState === AppState.ANALYZED && analysisResult && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
                      {analysisResult.suggestedQuestions.map((question, i) => (
                         <button 
                            key={i}
                            onClick={() => {
                               setChatInput(question);
                               // Small hack to ensure state updates before submit, ideally use a wrapper function
                               setTimeout(() => {
                                  // This won't work directly because chatInput is state. 
                                  // Instead we'll implement direct sending in a real app or just set input.
                                  // For now, let's just set input.
                               }, 0);
                            }}
                            className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
                         >
                            {question}
                         </button>
                      ))}
                  </div>
              )}

              {/* Input Box */}
              <div className="relative group">
                 <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                    placeholder="Ask a question about your source..." 
                    className="w-full h-14 pl-5 pr-14 rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-50 text-sm transition-all"
                    disabled={appState !== AppState.ANALYZED || isChatLoading}
                 />
                 <button 
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="absolute right-2 top-2 h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center cursor-pointer hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                     <ArrowRight className="w-5 h-5 text-white" />
                 </button>
                 {appState === AppState.ANALYZED && (
                    <div className="absolute right-14 top-4 text-xs font-medium text-gray-400">
                        {analysisResult?.sources.length} sources
                    </div>
                 )}
              </div>
              
              <div className="text-center mt-3">
                  <p className="text-[10px] text-gray-400">NoteStream can be inaccurate, please double check its responses.</p>
              </div>
           </div>
        </div>

        {/* Modal for viewing a note */}
        {activeNote && (
            <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center p-8">
                <div className="bg-white w-full max-w-2xl max-h-full overflow-y-auto rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
                        <div>
                             <h2 className="text-xl font-bold text-gray-900">{activeNote.title}</h2>
                             <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">{activeNote.type}</span>
                        </div>
                        <button onClick={() => setActiveNote(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-8 prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {activeNote.content}
                    </div>
                </div>
            </div>
        )}

      </main>

      {/* 3. RIGHT SIDEBAR - STUDIO / NOTES */}
      <aside className="w-[320px] bg-[#F9FAFB] flex flex-col border-l border-gray-200 shrink-0 hidden xl:flex">
         <div className="h-16 flex items-center justify-between px-5 border-b border-gray-200">
            <span className="font-semibold text-gray-900">Studio</span>
            <PanelLeft className="w-4 h-4 text-gray-400" />
         </div>

         <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
            
            {/* Audio Overview Card */}
            <div className="mb-8">
               <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                  <Info className="w-3.5 h-3.5" /> Audio Overview
               </div>
               <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Volume2 className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="text-sm font-semibold text-gray-900">Deep dive conversation</h4>
                        <p className="text-xs text-gray-400">1 host (English only)</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button className="flex-1 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50">Customize</button>
                     <button 
                        onClick={toggleSpeech}
                        className="flex-1 py-1.5 rounded-lg bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 shadow-sm shadow-blue-200"
                     >
                        {isPlaying ? 'Pause' : 'Generate'}
                     </button>
                  </div>
               </div>
            </div>

            {/* Notes Section */}
            <div>
               <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900">Notes</span>
                  <div className="flex gap-2">
                     <Search className="w-4 h-4 text-gray-400" />
                     <MoreVertical className="w-4 h-4 text-gray-400" />
                  </div>
               </div>

               <button 
                 className="w-full py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 shadow-sm hover:shadow mb-6 flex items-center justify-center gap-2 transition-all"
                 onClick={() => handleGenerateNote('Custom Note')}
               >
                   <Plus className="w-4 h-4" /> Add note
               </button>

               {/* Action Chips */}
               <div className="flex flex-wrap gap-2 mb-6">
                   {['Study Guide', 'Briefing Doc', 'FAQ', 'Timeline'].map(tag => (
                       <button 
                         key={tag} 
                         onClick={() => handleGenerateNote(tag)}
                         disabled={!!loadingNoteType}
                         className={`px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-gray-300 transition-all flex items-center gap-2 ${loadingNoteType === tag ? 'opacity-70' : ''}`}
                       >
                           {loadingNoteType === tag && <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>}
                           {tag}
                       </button>
                   ))}
               </div>

               {/* Notes List */}
               <div className="space-y-3">
                  {/* Generated Notes */}
                  {generatedNotes.map((note) => (
                    <div 
                        key={note.id} 
                        onClick={() => setActiveNote(note)}
                        className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
                    >
                       <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-1 bg-green-50 rounded text-green-600">
                              <FileText className="w-3 h-3" />
                          </div>
                          <div>
                             <h4 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{note.title}</h4>
                             <p className="text-xs text-gray-500 line-clamp-2">
                                {note.content}
                             </p>
                             <p className="text-[10px] text-gray-300 mt-2">{note.date.toLocaleTimeString()}</p>
                          </div>
                       </div>
                    </div>
                  ))}

                  {/* Initial Roadmap (if present) as a read-only note style */}
                  {analysisResult?.roadmap && (
                        <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer group opacity-75 grayscale hover:grayscale-0">
                           <div className="flex items-start gap-3">
                              <div className="mt-0.5 p-1 bg-yellow-100 rounded text-yellow-600">
                                  <FileText className="w-3 h-3" />
                              </div>
                              <div>
                                 <h4 className="text-sm font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">Initial Roadmap</h4>
                                 <p className="text-xs text-gray-500 line-clamp-2">
                                    {analysisResult.roadmap.length} steps generated during analysis.
                                 </p>
                              </div>
                           </div>
                        </div>
                  )}

                  {generatedNotes.length === 0 && !analysisResult && (
                     <div className="text-center py-10">
                        <p className="text-xs text-gray-400">No notes yet</p>
                     </div>
                  )}
               </div>

            </div>
         </div>
      </aside>

    </div>
  );
};

export default App;