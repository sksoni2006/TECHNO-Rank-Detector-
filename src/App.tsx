import React, { useState, useEffect } from 'react';
import { Calculator, Trophy, Users, Target, BarChart3 } from 'lucide-react';

// Simple Login Component
const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const envUsername = import.meta.env.VITE_USERNAME;
    const envPassword = import.meta.env.VITE_PASSWORD;
    if (username === envUsername && password === envPassword) {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Login</h2>
        {error && <div className="mb-4 text-red-600 text-center">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1 text-gray-700">Username</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 text-gray-700">Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded transition"
        >
          Login
        </button>
      </div>
    </div>
  );
};

const RankDetector = () => {
  const [squad, setSquad] = useState('');
  const [responses, setResponses] = useState(Array(18).fill(''));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rankData, setRankData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Answer keys
  const answerKeys = {
    'JR': {
      "1": "B", "2": "C", "3": "B", "4": "C", "5": "1", "6": "2", 
      "7": "56", "8": "5", "9": "64", "10": "B", "11": "B", "12": "A", 
      "13": "A", "14": "A", "15": "2", "16": "3", "17": "22", "18": "15"
    },
    'HE': {
      "1": "25", "2": "3", "3": "Bonus", "4": "18", "5": "Bonus", "6": "B", 
      "7": "C", "8": "A", "9": "11", "10": "Bonus", "11": "75", "12": "11", 
      "13": "60", "14": "C", "15": "A", "16": "Bonus", "17": "B", "18": "D"
    }
  };

  // Bonus schemes
  const bonusSchemes = {
    'level1': [0, 1, 3, 5, 7, 7],
    'level2': [0, 1, 5, 7, 7, 7],
    'level3': [0, 2, 6, 8, 10, 10]
  };

  const negativeBonusScheme = [0, -1, -2, -3, -4];

  // Load rank data from JSON file
  useEffect(() => {
    const loadRankData = async () => {
      try {
        const response = await fetch('/rankData.json');
        if (!response.ok) {
          throw new Error('Failed to load rank data');
        }
        const data = await response.json();
        console.log('Loaded rank data successfully:', data);
        setRankData(data);
      } catch (error) {
        console.error('Error loading rank data:', error);
        // Fallback to sample data if JSON fails to load
        const fallbackData = {
          'JR': [
            { score: 30.22, rank: 1 },
            { score: 23.95, rank: 2 },
            { score: 22.08, rank: 3 },
            { score: 20.15, rank: 4 },
            { score: 18.75, rank: 5 },
            { score: 17.22, rank: 6 },
            { score: 15.88, rank: 7 },
            { score: 14.33, rank: 8 },
            { score: 12.95, rank: 9 },
            { score: 11.42, rank: 10 }
          ],
          'HE': [
            { score: 28.45, rank: 1 },
            { score: 25.12, rank: 2 },
            { score: 23.88, rank: 3 },
            { score: 22.15, rank: 4 },
            { score: 20.95, rank: 5 },
            { score: 19.33, rank: 6 },
            { score: 17.88, rank: 7 },
            { score: 16.22, rank: 8 },
            { score: 14.75, rank: 9 },
            { score: 13.12, rank: 10 }
          ]
        };
        console.log('Using fallback data:', fallbackData);
        setRankData(fallbackData);
      } finally {
        setDataLoading(false);
      }
    };

    loadRankData();
  }, []);

  const evaluateResponse = (studentAnswer, correctAnswer, questionNum, squad) => {
    if (squad === 'HE' && correctAnswer === "Bonus") {
      return 'correct';
    }
    
    if (!studentAnswer || studentAnswer.trim() === '') {
      return 'skip';
    } else if (studentAnswer.toString().toUpperCase().trim() === correctAnswer.toString().toUpperCase().trim()) {
      return 'correct';
    } else {
      return 'wrong';
    }
  };

  const calculateBonuses = (responses) => {
    let positiveBonus = 0;
    let negativeBonus = 0;
    let currentLevel = 1;
    let consecutiveCorrect = 0;
    let consecutiveWrong = 0;
    let levelUnlocked = { level1: 1, level2: 0, level3: 0 };

    const processCorrectStreak = (consecutiveCount, currentLevel, levelUnlocked) => {
      let totalBonus = 0;
      let newLevel = currentLevel;

      if (currentLevel === 1) {
        if (consecutiveCount >= 4) {
          const bonusFirst4 = bonusSchemes['level1'][Math.min(4, bonusSchemes['level1'].length - 1)];
          totalBonus += bonusFirst4;
          newLevel = 3;
          levelUnlocked['level3'] = 1;

          if (consecutiveCount > 4) {
            const remaining = consecutiveCount - 4;
            const bonusRemaining = bonusSchemes['level3'][Math.min(remaining, bonusSchemes['level3'].length - 1)];
            totalBonus += bonusRemaining;
          }
        } else if (consecutiveCount >= 3) {
          const bonusFirst3 = bonusSchemes['level1'][3];
          totalBonus += bonusFirst3;
          newLevel = 2;
          levelUnlocked['level2'] = 1;

          if (consecutiveCount > 3) {
            const remaining = consecutiveCount - 3;
            const bonusRemaining = bonusSchemes['level2'][Math.min(remaining, bonusSchemes['level2'].length - 1)];
            totalBonus += bonusRemaining;
          }
        } else {
          const bonus = bonusSchemes['level1'][Math.min(consecutiveCount, bonusSchemes['level1'].length - 1)];
          totalBonus += bonus;
        }
      } else if (currentLevel === 2) {
        if (consecutiveCount >= 3) {
          const bonusFirst3 = bonusSchemes['level2'][3];
          totalBonus += bonusFirst3;
          newLevel = 3;
          levelUnlocked['level3'] = 1;

          if (consecutiveCount > 3) {
            const remaining = consecutiveCount - 3;
            const bonusRemaining = bonusSchemes['level3'][Math.min(remaining, bonusSchemes['level3'].length - 1)];
            totalBonus += bonusRemaining;
          }
        } else {
          const bonus = bonusSchemes['level2'][Math.min(consecutiveCount, bonusSchemes['level2'].length - 1)];
          totalBonus += bonus;
        }
      } else if (currentLevel === 3) {
        const bonus = bonusSchemes['level3'][Math.min(consecutiveCount, bonusSchemes['level3'].length - 1)];
        totalBonus += bonus;
      }

      return { totalBonus, newLevel };
    };

    const processWrongStreak = (consecutiveCount) => {
      if (consecutiveCount >= 4) {
        return negativeBonusScheme[4];
      } else if (consecutiveCount > 0) {
        return negativeBonusScheme[consecutiveCount];
      }
      return 0;
    };

    let i = 0;
    while (i < responses.length) {
      if (responses[i] === 'correct') {
        if (consecutiveWrong > 0) {
          const negBonus = processWrongStreak(consecutiveWrong);
          negativeBonus += negBonus;
          consecutiveWrong = 0;
        }
        consecutiveCorrect++;
      } else if (responses[i] === 'wrong') {
        if (consecutiveCorrect > 0) {
          const { totalBonus, newLevel } = processCorrectStreak(consecutiveCorrect, currentLevel, levelUnlocked);
          positiveBonus += totalBonus;
          currentLevel = newLevel;
          consecutiveCorrect = 0;
        }
        consecutiveWrong++;
      } else {
        if (consecutiveCorrect > 0) {
          const { totalBonus, newLevel } = processCorrectStreak(consecutiveCorrect, currentLevel, levelUnlocked);
          positiveBonus += totalBonus;
          currentLevel = newLevel;
          consecutiveCorrect = 0;
        }
        if (consecutiveWrong > 0) {
          const negBonus = processWrongStreak(consecutiveWrong);
          negativeBonus += negBonus;
          consecutiveWrong = 0;
        }
      }
      i++;
    }

    if (consecutiveCorrect > 0) {
      const { totalBonus } = processCorrectStreak(consecutiveCorrect, currentLevel, levelUnlocked);
      positiveBonus += totalBonus;
    }

    if (consecutiveWrong > 0) {
      const negBonus = processWrongStreak(consecutiveWrong);
      negativeBonus += negBonus;
    }

    return { positiveBonus, negativeBonus, levelUnlocked };
  };

  const calculateBaseScore = (correct, wrong, skip) => {
    const baseScore = correct * (2 + correct/3) - wrong * (wrong/6 + 1.5) - 0.05 * (skip ** 2);
    return Math.round(baseScore * 100) / 100;
  };

  // CORRECTED RANK CALCULATION FUNCTION - THE MAIN FIX
  const findRank = (score, squad) => {
    const data = rankData?.[squad];
    if (!data || data.length === 0) return 'N/A';

    console.log('Score to find:', score);
    console.log('Squad:', squad);
    console.log('Raw data sample:', data.slice(0, 5));

    // Sort data by score descending (highest score = rank 1)
    const sortedData = [...data].sort((a, b) => b.score - a.score);
    
    // Check for EXACT score matches first - this is the key fix
    const exactMatches = sortedData.filter(entry => entry.score === score);
    console.log('Exact matches found:', exactMatches);
    
    if (exactMatches.length > 0) {
      // Return the HIGHEST rank (worst position) for this exact score
      const highestRank = Math.max(...exactMatches.map(entry => entry.rank));
      console.log('Highest rank for this score:', highestRank);
      return highestRank;
    }
    
    // If score is higher than the highest score, return rank 1
    if (score > sortedData[0].score) {
      console.log('Score higher than all data, returning rank 1');
      return 1;
    }
    
    // If score is lower than the lowest score, estimate rank beyond the data
    if (score < sortedData[sortedData.length - 1].score) {
      const lastEntry = sortedData[sortedData.length - 1];
      const secondLastEntry = sortedData[sortedData.length - 2] || lastEntry;
      const scoreGap = secondLastEntry.score - lastEntry.score;
      const rankGap = lastEntry.rank - secondLastEntry.rank;
      
      if (scoreGap > 0) {
        const scoreDiff = lastEntry.score - score;
        const estimatedRankIncrease = Math.ceil(scoreDiff / scoreGap * rankGap);
        const estimatedRank = lastEntry.rank + estimatedRankIncrease;
        console.log('Score lower than all data, estimated rank:', estimatedRank);
        return estimatedRank;
      } else {
        const fallbackRank = lastEntry.rank + 1;
        console.log('Using fallback rank:', fallbackRank);
        return fallbackRank;
      }
    }
    
    // Find the two entries that the score falls between
    for (let i = 0; i < sortedData.length - 1; i++) {
      const upper = sortedData[i];     // Higher score (better rank)
      const lower = sortedData[i + 1]; // Lower score (worse rank)
      
      if (score < upper.score && score > lower.score) {
        // Linear interpolation between the two ranks
        const scoreRange = upper.score - lower.score;
        const rankRange = lower.rank - upper.rank;
        
        if (scoreRange === 0) {
          const maxRank = Math.max(upper.rank, lower.rank);
          console.log('Zero score range, using max rank:', maxRank);
          return maxRank;
        }
        
        const ratio = (upper.score - score) / scoreRange;
        const interpolatedRank = upper.rank + (ratio * rankRange);
        const finalRank = Math.round(interpolatedRank);
        console.log('Interpolated rank:', finalRank);
        
        return finalRank;
      }
    }
    
    // Fallback
    const fallbackRank = sortedData[sortedData.length - 1].rank + 1;
    console.log('Fallback rank:', fallbackRank);
    return fallbackRank;
  };

  const calculateScore = () => {
    if (!squad || !rankData) {
      alert('Please select a squad and wait for data to load');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      const answerKey = answerKeys[squad];
      const studentResponses = [];
      let correctCount = 0;
      let wrongCount = 0;
      let skipCount = 0;

      console.log('Starting calculation for squad:', squad);

      // Evaluate each response
      for (let i = 0; i < 18; i++) {
        const questionNum = (i + 1).toString();
        const result = evaluateResponse(responses[i], answerKey[questionNum], questionNum, squad);
        studentResponses.push(result);

        if (result === 'correct') correctCount++;
        else if (result === 'wrong') wrongCount++;
        else skipCount++;
      }

      console.log('Response evaluation:', { correctCount, wrongCount, skipCount });

      // Calculate base score
      const baseScore = calculateBaseScore(correctCount, wrongCount, skipCount);
      console.log('Base score:', baseScore);

      // Calculate bonuses
      const { positiveBonus, negativeBonus, levelUnlocked } = calculateBonuses(studentResponses);
      console.log('Bonuses:', { positiveBonus, negativeBonus });

      // Calculate total score
      const totalScore = Math.round((baseScore + positiveBonus + negativeBonus) * 100) / 100;
      console.log('Total score:', totalScore);

      // Find predicted rank
      const predictedRank = findRank(totalScore, squad);
      console.log('Final predicted rank:', predictedRank);

      setResults({
        correct: correctCount,
        wrong: wrongCount,
        skip: skipCount,
        baseScore,
        positiveBonus,
        negativeBonus,
        totalScore,
        levelUnlocked,
        predictedRank,
        responses: studentResponses
      });

      setLoading(false);
    }, 1000);
  };

  const handleResponseChange = (index, value) => {
    const newResponses = [...responses];
    newResponses[index] = value;
    setResponses(newResponses);
  };

  const resetForm = () => {
    setSquad('');
    setResponses(Array(18).fill(''));
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      {dataLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading rank data...</p>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-10 w-10 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">TECHNO Rank Detector</h1>
          </div>
          <p className="text-lg text-gray-600">Calculate your score and predict your rank</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Squad Selection */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Users className="mr-2 text-indigo-600" />
              Select Squad
            </h2>
            <div className="flex space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="squad"
                  value="JR"
                  checked={squad === 'JR'}
                  onChange={(e) => setSquad(e.target.value)}
                  className="mr-2"
                />
                <span className="text-lg">Junior (JR)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="squad"
                  value="HE"
                  checked={squad === 'HE'}
                  onChange={(e) => setSquad(e.target.value)}
                  className="mr-2"
                />
                <span className="text-lg">Hauts (HE)</span>
              </label>
            </div>
          </div>

          {/* Questions */}
          {squad && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Target className="mr-2 text-indigo-600" />
                Enter Your Responses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 18 }, (_, i) => (
                  <div key={i} className="flex flex-col">
                    <label className="text-sm font-medium mb-1 text-gray-700">
                      Question {i + 1}
                      {squad === 'HE' && answerKeys[squad][(i + 1).toString()] === 'Bonus' && (
                        <span className="text-green-600 text-xs ml-1">(Bonus)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={responses[i]}
                      onChange={(e) => handleResponseChange(i, e.target.value)}
                      placeholder="Your answer"
                      className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calculate Button */}
          {squad && (
            <div className="text-center mb-6">
              <button
                onClick={calculateScore}
                disabled={loading || dataLoading || !rankData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-200 flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator className="mr-2" />
                {loading ? 'Calculating...' : dataLoading ? 'Loading Data...' : 'Calculate Score & Rank'}
              </button>
              <button
                onClick={resetForm}
                disabled={dataLoading}
                className="ml-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <BarChart3 className="mr-2 text-indigo-600" />
                Your Results
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{results.correct}</div>
                  <div className="text-sm text-green-600">Correct</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{results.wrong}</div>
                  <div className="text-sm text-red-600">Wrong</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{results.skip}</div>
                  <div className="text-sm text-yellow-600">Skipped</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{results.totalScore}</div>
                  <div className="text-sm text-blue-600">Total Score</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Score Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base Score:</span>
                      <span className="font-mono">{results.baseScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Positive Bonus:</span>
                      <span className="font-mono text-green-600">+{results.positiveBonus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Negative Bonus:</span>
                      <span className="font-mono text-red-600">{results.negativeBonus}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Total Score:</span>
                      <span className="font-mono">{results.totalScore}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Levels Unlocked</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Level 1:</span>
                      <span className={`font-bold ${results.levelUnlocked.level1 ? 'text-green-600' : 'text-gray-400'}`}>
                        {results.levelUnlocked.level1 ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Level 2:</span>
                      <span className={`font-bold ${results.levelUnlocked.level2 ? 'text-green-600' : 'text-gray-400'}`}>
                        {results.levelUnlocked.level2 ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Level 3:</span>
                      <span className={`font-bold ${results.levelUnlocked.level3 ? 'text-green-600' : 'text-gray-400'}`}>
                        {results.levelUnlocked.level3 ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 p-6 rounded-lg text-center">
                <h3 className="text-xl font-semibold mb-2 text-indigo-800">Predicted Rank</h3>
                <div className="text-4xl font-bold text-indigo-600">#{results.predictedRank}</div>
                <p className="text-sm text-indigo-600 mt-2">Based on historical data analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [authenticated, setAuthenticated] = useState(false);

  return authenticated ? (
    <RankDetector />
  ) : (
    <Login onLogin={() => setAuthenticated(true)} />
  );
};

export default App;