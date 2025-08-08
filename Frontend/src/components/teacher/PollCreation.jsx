import React, { useState } from 'react';

const PollCreation = ({ sessionId, onPollCreated }) => {
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    justification: '',
    time_limit: 60,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'correct_answer' || name === 'time_limit') {
      setFormData({ ...formData, [name]: parseInt(value) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that all options are filled
    if (formData.options.some(option => !option.trim())) {
      alert('Please fill in all options');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          ...formData,
        }),
      });

      if (response.ok) {
        alert('Poll created successfully!');
        setFormData({
          question: '',
          options: ['', '', '', ''],
          correct_answer: 0,
          justification: '',
          time_limit: 60,
        });
        onPollCreated();
      } else {
        const error = await response.json();
        alert('Error creating poll: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Error creating poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Create New Poll</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Question *</label>
          <textarea
            name="question"
            value={formData.question}
            onChange={handleChange}
            className="input-field"
            rows="3"
            placeholder="Enter your question here..."
            required
          />
        </div>

        <div>
          <label className="label">Options *</label>
          <div className="space-y-2">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600 w-8">
                  {String.fromCharCode(65 + index)}.
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="input-field flex-1"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  required
                />
                <input
                  type="radio"
                  name="correct_answer"
                  value={index}
                  checked={formData.correct_answer === index}
                  onChange={handleChange}
                  className="text-primary-600"
                />
                <span className="text-sm text-gray-500">Correct</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Justification/Explanation</label>
          <textarea
            name="justification"
            value={formData.justification}
            onChange={handleChange}
            className="input-field"
            rows="2"
            placeholder="Explain why the correct answer is right..."
          />
        </div>

        <div>
          <label className="label">Time Limit (seconds)</label>
          <select
            name="time_limit"
            value={formData.time_limit}
            onChange={handleChange}
            className="input-field"
          >
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={90}>1.5 minutes</option>
            <option value={120}>2 minutes</option>
            <option value={180}>3 minutes</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Creating Poll...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
};

export default PollCreation;

