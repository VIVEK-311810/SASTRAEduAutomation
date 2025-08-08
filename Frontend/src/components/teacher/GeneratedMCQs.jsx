import React, { useState, useEffect } from 'react';

const GeneratedMCQs = ({ sessionId, generatedMCQs, onMCQsSent }) => {
  const [mcqs, setMcqs] = useState([]);
  const [selectedMCQs, setSelectedMCQs] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [editingMCQ, setEditingMCQ] = useState(null);

  useEffect(() => {
    if (generatedMCQs && Array.isArray(generatedMCQs)) {
      // Add unique IDs to MCQs for tracking
      const mcqsWithIds = generatedMCQs.map((mcq, index) => ({
        ...mcq,
        tempId: `temp_${index}`,
        isEdited: false
      }));
      setMcqs(mcqsWithIds);
      // Select all MCQs by default
      setSelectedMCQs(new Set(mcqsWithIds.map(mcq => mcq.tempId)));
    }
  }, [generatedMCQs]);

  const handleMCQSelection = (tempId) => {
    const newSelected = new Set(selectedMCQs);
    if (newSelected.has(tempId)) {
      newSelected.delete(tempId);
    } else {
      newSelected.add(tempId);
    }
    setSelectedMCQs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMCQs.size === mcqs.length) {
      setSelectedMCQs(new Set());
    } else {
      setSelectedMCQs(new Set(mcqs.map(mcq => mcq.tempId)));
    }
  };

  const handleEditMCQ = (tempId) => {
    const mcq = mcqs.find(m => m.tempId === tempId);
    setEditingMCQ({ ...mcq });
  };

  const handleSaveEdit = () => {
    setMcqs(mcqs.map(mcq => 
      mcq.tempId === editingMCQ.tempId 
        ? { ...editingMCQ, isEdited: true }
        : mcq
    ));
    setEditingMCQ(null);
  };

  const handleCancelEdit = () => {
    setEditingMCQ(null);
  };

  const handleSendToStudents = async () => {
    const selectedMCQData = mcqs.filter(mcq => selectedMCQs.has(mcq.tempId));
    
    if (selectedMCQData.length === 0) {
      alert('Please select at least one MCQ to send to students.');
      return;
    }

    setLoading(true);
    try {
      // Send each selected MCQ as a separate poll
      for (const mcq of selectedMCQData) {
        const pollData = {
          session_id: sessionId,
          question: mcq.question,
          options: mcq.options,
          correct_answer: mcq.correct_answer,
          justification: mcq.justification || '',
          time_limit: mcq.time_limit || 60
        };

        const response = await fetch('http://localhost:3001/api/polls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pollData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create poll: ${response.statusText}`);
        }
      }

      alert(`Successfully sent ${selectedMCQData.length} MCQ(s) to students!`);
      
      // Clear the MCQs after successful sending
      setMcqs([]);
      setSelectedMCQs(new Set());
      
      // Notify parent component
      if (onMCQsSent) {
        onMCQsSent();
      }
    } catch (error) {
      console.error('Error sending MCQs:', error);
      alert('Error sending MCQs to students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mcqs || mcqs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Generated MCQs</h3>
        <p className="text-gray-500">No generated MCQs available. MCQs will appear here when generated from class transcripts.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Generated MCQs ({mcqs.length})</h3>
        <div className="flex space-x-2">
          <button
            onClick={handleSelectAll}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
          >
            {selectedMCQs.size === mcqs.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={handleSendToStudents}
            disabled={selectedMCQs.size === 0 || loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium"
          >
            {loading ? 'Sending...' : `Send ${selectedMCQs.size} MCQ(s) to Students`}
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {mcqs.map((mcq, index) => (
          <div key={mcq.tempId} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedMCQs.has(mcq.tempId)}
                  onChange={() => handleMCQSelection(mcq.tempId)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-500">MCQ {index + 1}</span>
                {mcq.isEdited && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Edited</span>
                )}
              </div>
              <button
                onClick={() => handleEditMCQ(mcq.tempId)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit
              </button>
            </div>

            <div className="mb-3">
              <h4 className="font-medium text-gray-800 mb-2">{mcq.question}</h4>
              <div className="space-y-1">
                {mcq.options.map((option, optionIndex) => (
                  <div key={optionIndex} className={`text-sm p-2 rounded ${
                    optionIndex === mcq.correct_answer 
                      ? 'bg-green-50 text-green-800 font-medium' 
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    {String.fromCharCode(65 + optionIndex)}. {option}
                    {optionIndex === mcq.correct_answer && ' ✓'}
                  </div>
                ))}
              </div>
            </div>

            {mcq.justification && (
              <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                <strong>Justification:</strong> {mcq.justification}
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2">
              Time Limit: {mcq.time_limit || 60} seconds
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingMCQ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit MCQ</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <textarea
                  value={editingMCQ.question}
                  onChange={(e) => setEditingMCQ({...editingMCQ, question: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                {editingMCQ.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={editingMCQ.correct_answer === index}
                      onChange={() => setEditingMCQ({...editingMCQ, correct_answer: index})}
                      className="w-4 h-4 text-blue-600"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editingMCQ.options];
                        newOptions[index] = e.target.value;
                        setEditingMCQ({...editingMCQ, options: newOptions});
                      }}
                      className="flex-1 p-2 border border-gray-300 rounded-md"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                <textarea
                  value={editingMCQ.justification || ''}
                  onChange={(e) => setEditingMCQ({...editingMCQ, justification: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="2"
                  placeholder="Explain why this question is important..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (seconds)</label>
                <input
                  type="number"
                  value={editingMCQ.time_limit || 60}
                  onChange={(e) => setEditingMCQ({...editingMCQ, time_limit: parseInt(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="10"
                  max="300"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedMCQs;
