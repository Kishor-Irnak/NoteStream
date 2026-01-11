import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TopicStat } from '../types';

interface ChartsProps {
  data: TopicStat[];
}

const Charts: React.FC<ChartsProps> = ({ data }) => {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          barSize={32}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <XAxis 
            dataKey="topic" 
            tick={{fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter'}} 
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis 
            tick={{fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter'}} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{fill: '#F9FAFB'}}
            contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '8px 12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                fontFamily: 'Inter',
                fontSize: '12px',
                color: '#374151'
            }}
          />
          <Bar dataKey="complexity" radius={[4, 4, 0, 0]}>
             {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#111827' : '#4B5563'} />
              ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Charts;