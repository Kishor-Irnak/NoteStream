import React from 'react';
import { RoadmapStep } from '../types';
import { Clock, CheckCircle2 } from 'lucide-react';

interface RoadmapProps {
  steps: RoadmapStep[];
}

const Roadmap: React.FC<RoadmapProps> = ({ steps }) => {
  return (
    <div className="space-y-4">
      {steps.map((item, index) => (
        <div key={index} className="flex items-start group">
          <div className="flex flex-col items-center mr-4 mt-1">
             <div className="w-6 h-6 rounded-full border border-gray-200 bg-white flex items-center justify-center text-xs font-medium text-gray-500 group-hover:border-gray-900 group-hover:text-gray-900 transition-colors">
                {index + 1}
             </div>
             {index !== steps.length - 1 && (
                 <div className="w-px h-full bg-gray-100 my-1"></div>
             )}
          </div>
          
          <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-sm font-semibold text-gray-900">{item.step}</h3>
              <div className="flex items-center text-[10px] uppercase font-bold tracking-wider text-gray-400">
                <Clock className="w-3 h-3 mr-1" />
                {item.estimatedTime}
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Roadmap;