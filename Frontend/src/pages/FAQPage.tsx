import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
const faqs = [{
  category: 'Donation Basics',
  items: [{
    question: 'Who can donate blood?',
    answer: 'Generally, anyone aged 18-65, weighing at least 45kg, and in good health can donate blood. You should not have donated blood in the last 3 months (for men) or 4 months (for women).'
  }, {
    question: 'Is it safe to donate blood?',
    answer: 'Yes, absolutely. We use sterile, single-use needles and equipment for every donation. There is zero risk of contracting any disease through blood donation.'
  }, {
    question: 'How long does the process take?',
    answer: 'The actual donation takes only 10-15 minutes. However, the entire process including registration, screening, and post-donation rest takes about 45-60 minutes.'
  }]
}, {
  category: 'Registration & Account',
  items: [{
    question: 'How do I register as a donor?',
    answer: 'Click on the "Become a Donor" button, fill in your details including blood group and location, verify your phone number, and you\'re set!'
  }, {
    question: 'Why do I need to verify my identity?',
    answer: 'Verification ensures the safety and reliability of our blood donation network. It helps prevent fraud and ensures that donors are genuine.'
  }]
}, {
  category: 'Emergency Requests',
  items: [{
    question: 'How do I request blood in an emergency?',
    answer: 'You can use the "Find Blood" feature to search for nearby donors or hospitals. In critical situations, use the Emergency Hotline (1660-01-66666) or the Emergency Alert button on the dashboard.'
  }, {
    question: 'Is there a cost for requesting blood?',
    answer: 'LifeFlow is a free platform connecting donors and recipients. However, hospitals may charge standard processing fees for blood testing and storage.'
  }]
}];
export function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const toggleAccordion = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };
  const filteredFaqs = faqs.map(category => ({
    ...category,
    items: category.items.filter(item => item.question.toLowerCase().includes(searchQuery.toLowerCase()) || item.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  })).filter(category => category.items.length > 0);
  return <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Find answers to common questions about blood donation and LifeFlow
          </p>

          <div className="mt-8 max-w-xl mx-auto">
            <Input placeholder="Search questions..." leftIcon={<SearchIcon className="w-5 h-5" />} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-white" />
          </div>
        </div>

        <div className="space-y-8">
          {filteredFaqs.map((category, catIndex) => <div key={category.category}>
              <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4 ml-2">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.items.map((faq, index) => {
              const id = `${catIndex}-${index}`;
              const isOpen = openIndex === id;
              return <Card key={index} className="cursor-pointer transition-all duration-200" padding="none" onClick={() => toggleAccordion(id)}>
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className={`font-medium text-lg ${isOpen ? 'text-primary' : 'text-gray-900'}`}>
                            {faq.question}
                          </h3>
                          {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                        </div>
                        {isOpen && <div className="mt-4 text-gray-600 leading-relaxed animate-fade-in">
                            {faq.answer}
                          </div>}
                      </div>
                    </Card>;
            })}
              </div>
            </div>)}

          {filteredFaqs.length === 0 && <div className="text-center py-12">
              <p className="text-gray-500">No matching questions found.</p>
            </div>}
        </div>
      </div>
    </div>;
}