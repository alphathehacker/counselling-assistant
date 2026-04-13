import React, { useState, useEffect } from 'react';

const JeePredictor = () => {
  const [marks, setMarks] = useState(175);
  const [percentile, setPercentile] = useState(0);
  const [rank, setRank] = useState(0);

  // Constants for estimation based on general trends
  const TOTAL_MARKS = 300;
  // A more accurate approximation formula for JEE Main based on 2024 trends
  const calculateEstimate = (m) => {
    let p = 0;

    if (m <= 0) p = 0;
    else if (m < 44) p = (m / 44) * 80; // Interpolate up to ~80 percentile
    else if (m < 64) p = 80 + ((m - 44) / 20) * 8; // ~80 to ~88 percentile
    else if (m < 89) p = 88 + ((m - 64) / 25) * 4; // ~88 to ~92 percentile
    else if (m < 110) p = 92 + ((m - 89) / 21) * 3; // ~92 to ~95 percentile
    else if (m < 132) p = 95 + ((m - 110) / 22) * 2; // ~95 to ~97 percentile
    else if (m < 161) p = 97 + ((m - 132) / 29) * 1.5; // ~97 to ~98.5 percentile
    else if (m < 190) p = 98.5 + ((m - 161) / 29) * 0.8; // ~98.5 to ~99.3 percentile
    else if (m < 215) p = 99.3 + ((m - 190) / 25) * 0.4; // ~99.3 to ~99.7 percentile
    else if (m < 250) p = 99.7 + ((m - 215) / 35) * 0.2; // ~99.7 to ~99.9 percentile
    else if (m < 280) p = 99.9 + ((m - 250) / 30) * 0.09; // ~99.9 to ~99.99 percentile
    else p = 99.99 + ((m - 280) / 20) * 0.009; // ~99.99 to 99.999...

    // Cap at 99.999
    p = Math.min(p, 99.999);

    // Calculate approximate rank based on roughly 1.4 million candidates in 2024
    const totalCandidates = 1400000;
    let r = Math.round(((100 - p) / 100) * totalCandidates);

    if (r <= 0) r = 1; // Rank 1 is the highest
    if (p === 0) r = totalCandidates;

    return {
      p: Math.floor(p * 100) / 100 < 99.99 ? p.toFixed(2) : p.toFixed(4),
      r: r.toLocaleString('en-IN')
    };
  };

  useEffect(() => {
    const { p, r } = calculateEstimate(marks);
    setPercentile(p);
    setRank(r);
  }, [marks]);

  const handleSliderChange = (e) => {
    setMarks(Number(e.target.value));
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 rounded-2xl p-8 relative overflow-hidden ring-1 ring-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
        {/* Badge */}
        <div className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100 flex items-center space-x-2 mb-6">
          <span className="w-2 h-2 bg-[#00DDA3] rounded-full animate-pulse"></span>
          <span className="text-xs font-bold tracking-wider text-purple-600 uppercase">Live Rank Check</span>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Estimate Your Rank</h3>
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">BASED ON JEE 2025 TRENDS</p>
        </div>

        {/* Results Cards */}
        <div className="flex flex-col sm:flex-row gap-4 w-full mb-10">
          {/* Percentile Card */}
          <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100/50 flex-1 rounded-2xl p-6 flex flex-col items-center justify-center transition-all hover:shadow-md">
            <span className="text-[11px] font-bold tracking-widest text-gray-400 mb-2 uppercase">PERCENTILE</span>
            <span className="text-4xl font-bold text-[#A824FF]">{percentile}</span>
          </div>

          {/* Rank Card */}
          <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100/50 flex-1 rounded-2xl p-6 flex flex-col items-center justify-center transition-all hover:shadow-md">
            <span className="text-[11px] font-bold tracking-widest text-gray-400 mb-2 uppercase">RANK</span>
            <span className="text-4xl font-bold text-[#0D6EFD]">{rank}</span>
          </div>
        </div>

        {/* Slider Section */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 font-medium">Marks (Out of {TOTAL_MARKS})</span>
            <span className="text-2xl font-bold text-gray-900">{marks}</span>
          </div>

          <div className="relative w-full h-8 flex items-center mb-2">
            <input
              type="range"
              min="0"
              max="300"
              value={marks}
              onChange={handleSliderChange}
              className="absolute w-full h-3 appearance-none bg-transparent z-20 cursor-pointer"
              style={{
                WebkitAppearance: 'none',
              }}
            />
            {/* Custom Track */}
            <div className="absolute w-full h-3 bg-blue-100 rounded-full overflow-hidden pointer-events-none z-0">
              <div
                className="h-full bg-gradient-to-r from-purple-200/50 via-[#A824FF]/60 to-[#0D6EFD]/60 pointer-events-none"
                style={{ width: `${(marks / TOTAL_MARKS) * 100}%` }}
              ></div>
            </div>
            {/* Custom Thumb - simulating the look since native range thumb styling is tricky cross-browser */}
            <div
              className="absolute w-5 h-5 bg-[#A824FF] rounded-full shadow-lg pointer-events-none z-10 transition-transform hover:scale-110"
              style={{
                left: `calc(${(marks / TOTAL_MARKS) * 100}% - 10px)`
              }}
            ></div>
          </div>

          <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
            <span>0</span>
            <span>100</span>
            <span>200</span>
            <span>300</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
          border: none;
        }
      `}} />
    </div>
  );
};

export default JeePredictor;
