import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ToggleSwitch from '../components/ToggleSwitch';

const NotificationSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    newMessages: true,
    communityUpdates: true,
    promotions: false,
    listingUpdates: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationOptions = [
    {
      key: 'newMessages' as const,
      title: 'New Messages',
      description: 'Get notified when someone sends you a direct message.',
    },
    {
      key: 'communityUpdates' as const,
      title: 'Community Updates',
      description: 'Receive alerts for new posts or comments in communities you follow.',
    },
    {
      key: 'listingUpdates' as const,
      title: 'Listing Updates',
      description: 'Notifications about your listings or items you\'ve saved.',
    },
    {
      key: 'promotions' as const,
      title: 'Promotional Offers',
      description: 'Receive updates on special offers and platform news.',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-8">
        <Link to="/settings" className="p-2 rounded-full hover:bg-gray-100 mr-2">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>
      
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="divide-y divide-gray-100">
          {notificationOptions.map((option, index) => (
            <div key={option.key} className={`flex items-center justify-between py-4 ${index === 0 ? 'pt-2' : ''} ${index === notificationOptions.length - 1 ? 'pb-2' : ''}`}>
              <div className="pr-4">
                <h3 className="font-semibold text-gray-800">{option.title}</h3>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
              <ToggleSwitch 
                id={option.key}
                checked={settings[option.key]}
                onChange={() => handleToggle(option.key)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
