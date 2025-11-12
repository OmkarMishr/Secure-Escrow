import { Link } from 'react-router-dom';

export default function Home() {
  const features = [
    {
      title: 'Secure Payment Holding',
      description: 'Funds are safely held in escrow until delivery conditions are met',
      icon: '🛡️',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Dispute Resolution',
      description: 'Professional mediation service for transaction disputes',
      icon: '⚖️',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      title: 'Multi-Currency Support',
      description: 'Support for multiple currencies including INR, USD, EUR',
      icon: '💱',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Real-time Tracking',
      description: 'Track your transaction status in real-time',
      icon: '📊',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Secure Payment Gateway',
      description: 'Integrated with Razorpay for secure payment processing',
      icon: '💳',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: '24/7 Support',
      description: 'Round-the-clock customer support for all users',
      icon: '🎧',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20'
    }
  ];

  const stats = [
    { label: 'Total Transactions', value: '₹50,00,000+' },
    { label: 'Happy Users', value: '10,000+' },
    { label: 'Success Rate', value: '99.9%' },
    { label: 'Support Available', value: '24/7' }
  ];

  return (
    <div className="min-h-screen min-w-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-gray-100 mb-6">
            Secure Digital Escrow Platform
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Protect your transactions with our trusted escrow service. Buy and sell with confidence 
            knowing your funds are secure until all conditions are met.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-teal-800 hover:bg-teal-900 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Get Started
            </Link>
            <Link 
              to="/login" 
              className="bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-900 dark:text-gray-100 px-8 py-3 rounded-lg font-medium border border-slate-300 dark:border-slate-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-teal-600 dark:text-teal-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-slate-900 dark:text-gray-100 mb-12">
            Why Choose SecureEscrow?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
              >
                <div className={`w-16 h-16 ${feature.bgColor} rounded-full flex items-center justify-center text-3xl mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-gray-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-teal-600 dark:bg-teal-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-teal-100 mb-8 text-lg max-w-2xl mx-auto">
            Join thousands of users who trust SecureEscrow for their transactions
          </p>
          <Link 
            to="/register" 
            className="bg-white hover:bg-gray-100 text-teal-600 px-8 py-3 rounded-lg font-medium inline-block transition-colors"
          >
            Create Your Account
          </Link>
        </div>
      </section>
    </div>
  );
}
