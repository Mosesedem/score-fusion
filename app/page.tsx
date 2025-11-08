'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Trophy, Star, ArrowRight, CheckCircle, Gift, Zap } from 'lucide-react'

export default function Home() {
  const [activeUsers, setActiveUsers] = useState(1247)
  const [recentWins, setRecentWins] = useState(89)
  const [onlineNow, setOnlineNow] = useState(342)

  // Simulate real-time stats
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 3) - 1)
      setRecentWins(prev => prev + Math.floor(Math.random() * 2))
      setOnlineNow(prev => prev + Math.floor(Math.random() * 5) - 2)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const featuredTips = [
    {
      id: 1,
      title: "Man City vs Liverpool - Over 2.5 Goals",
      sport: "Football",
      odds: "1.85",
      confidence: "High",
      author: "ProTipster",
      time: "2 hours ago"
    },
    {
      id: 2,
      title: "Lakers vs Celtics - Lakers to Cover",
      sport: "Basketball",
      odds: "2.10",
      confidence: "Medium",
      author: "SportsAnalyst",
      time: "3 hours ago"
    },
    {
      id: 3,
      title: "Nadal vs Djokovic - Set 1 Winner",
      sport: "Tennis",
      odds: "1.95",
      confidence: "High",
      author: "TennisPro",
      time: "5 hours ago"
    }
  ]

  const recentWinners = [
    { user: "AlexM", amount: "$450", game: "Football", time: "2 mins ago" },
    { user: "SarahK", amount: "$230", game: "Basketball", time: "5 mins ago" },
    { user: "MikeR", amount: "$180", game: "Tennis", time: "8 mins ago" },
    { user: "LisaT", amount: "$320", game: "Football", time: "12 mins ago" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Trophy className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                ScoreFusion
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-slate-600 hover:text-green-600 transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-slate-600 hover:text-green-600 transition-colors">How It Works</Link>
              <Link href="/tips" className="text-slate-600 hover:text-green-600 transition-colors">Tips</Link>
              <Link href="/vip" className="text-slate-600 hover:text-green-600 transition-colors">VIP</Link>
              <Link href="/earnings" className="text-slate-600 hover:text-green-600 transition-colors">Earn</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered Sports Predictions
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Win More with
              <span className="block bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Expert Sports Tips
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto">
              Join thousands of successful bettors using our AI-powered predictions, expert analysis, and proven strategies to maximize their winnings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg px-8 py-3">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/tips">
                <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                  View Free Tips
                </Button>
              </Link>
            </div>

            {/* Live Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">Active Users</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeUsers.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">Today's Wins</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{recentWins}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">Online Now</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{onlineNow}</p>
                  </div>
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Winners Ticker */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 py-4 overflow-hidden">
        <div className="flex items-center space-x-8 animate-scroll">
          {recentWinners.map((winner, index) => (
            <div key={index} className="flex items-center space-x-2 text-white whitespace-nowrap">
              <Trophy className="h-4 w-4" />
              <span className="font-medium">{winner.user}</span>
              <span>won {winner.amount}</span>
              <span className="text-green-100">({winner.game})</span>
              <span className="text-green-200">{winner.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Tips */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Featured Predictions
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Check out our latest expert predictions with high success rates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTips.map((tip) => (
              <Card key={tip.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{tip.sport}</Badge>
                    <Badge className={tip.confidence === 'High' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {tip.confidence} Confidence
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{tip.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-green-600">{tip.odds}</span>
                    <span className="text-sm text-slate-500">{tip.time}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>By {tip.author}</span>
                    <Link href="/tips">
                      <Button variant="ghost" size="sm">View Details →</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/tips">
              <Button variant="outline" size="lg">
                View All Free Tips
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Why Choose ScoreFusion?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              The most comprehensive platform for sports betting predictions and earnings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Predictions</h3>
              <p className="text-slate-600 dark:text-slate-300">
                AI-powered analysis from professional sports analysts with proven track records
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">High Success Rate</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Over 75% success rate on our VIP predictions with detailed analysis
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Get tokens for activities and convert them to real cash or exclusive content
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Referral Program</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Earn $5 for every friend who signs up and track your referral earnings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Start winning in just 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Sign Up Free</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Create your account in seconds and get instant access to free tips and welcome bonuses
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Follow Expert Tips</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Access daily predictions, detailed analysis, and VIP content from professional tipsters
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Win & Earn</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Place winning bets, earn tokens, and convert them to real cash or exclusive rewards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings Highlight */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Turn Your Knowledge into Cash
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Earn tokens for every activity and convert them to real money. Join our referral program and earn $5 for every friend!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Gift className="h-12 w-12 text-white mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Daily Login Bonus</h3>
              <p className="text-green-100">Get 5 tokens just for logging in daily</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <TrendingUp className="h-12 w-12 text-white mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Convert to Cash</h3>
              <p className="text-green-100">100 tokens = $1.00 real money</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Users className="h-12 w-12 text-white mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Refer Friends</h3>
              <p className="text-green-100">Earn $5 + 50 tokens per referral</p>
            </div>
          </div>
          <Link href="/earnings">
            <Button variant="secondary" size="lg" className="bg-white text-green-600 hover:bg-gray-100">
              Start Earning Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
            Ready to Start Winning?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            Join thousands of successful bettors. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/vip">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Upgrade to VIP
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>No credit card required</span>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Cancel anytime</span>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Instant access</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="h-8 w-8 text-green-600" />
                <span className="text-2xl font-bold">ScoreFusion</span>
              </div>
              <p className="text-slate-400 mb-4">
                Your trusted platform for expert sports predictions and betting insights.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/tips" className="hover:text-white transition-colors">Free Tips</Link></li>
                <li><Link href="/vip" className="hover:text-white transition-colors">VIP Predictions</Link></li>
                <li><Link href="/earnings" className="hover:text-white transition-colors">Earn Rewards</Link></li>
                <li><Link href="/referral" className="hover:text-white transition-colors">Referral Program</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/responsible-gaming" className="hover:text-white transition-colors">Responsible Gaming</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 ScoreFusion. All rights reserved. | For entertainment purposes only.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}