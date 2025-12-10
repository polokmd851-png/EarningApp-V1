import React, { useState } from 'react';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const LoginView: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegistering) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        // Update display name immediately after registration
        if (name) {
          await updateProfile(res.user, { displayName: name });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (err.code === 'auth/user-not-found') msg = 'No user found with this email.';
      if (err.code === 'auth/email-already-in-use') msg = 'Email already in use.';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-['Poppins'] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 w-full max-w-md p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2 font-['Orbitron']">
             PRO EARNING
          </h1>
          <p className="text-gray-400 text-sm">
            {isRegistering ? 'Create your secure account' : 'Welcome back, Investor'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">FULL NAME</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="John Doe"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">EMAIL ADDRESS</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">PASSWORD</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95 mt-4"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : (isRegistering ? 'CREATE ACCOUNT' : 'LOGIN SECURELY')}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs text-gray-500 font-bold">OR CONTINUE WITH</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 bg-white text-gray-800 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          <span>Google</span>
        </button>

        <p className="text-center mt-8 text-sm text-gray-400">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"} <br/>
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-400 font-bold hover:text-blue-300 mt-2"
          >
            {isRegistering ? 'Login Here' : 'Register Now'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginView;