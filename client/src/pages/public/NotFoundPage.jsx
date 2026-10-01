import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaHome, FaArrowRight } from 'react-icons/fa'
export default function NotFoundPage(){
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white dark:bg-gray-950 px-4">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="text-center max-w-md">
        <div className="text-8xl md:text-9xl font-bold text-primary-400 mb-4 leading-none">404</div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">Page Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm md:text-base">The page you are looking for does not exist or has been moved.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/" className="btn-primary"><FaHome size={14}/>Go Home</Link>
          <Link to="/contact" className="btn-outline"><FaArrowRight size={14}/>Contact Us</Link>
        </div>
      </motion.div>
    </div>
  )
}
