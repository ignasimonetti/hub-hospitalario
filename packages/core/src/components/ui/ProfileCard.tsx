// ProfileCard - Tarjeta de perfil avanzada con diseño moderno
import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader } from './card'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Badge } from './badge'
import { Button } from './button'
import { 
  User, 
  Mail, 
  Shield, 
  Hospital, 
  CheckCircle, 
  Edit3,
  Camera,
  Award,
  Calendar
} from 'lucide-react'
import { cn } from '../../lib/utils'

export interface ProfileCardProps {
  user: {
    email: string
    firstName?: string
    lastName?: string
    first_name?: string
    last_name?: string
    avatar?: string
  }
  role?: {
    name: string
  }
  tenant?: {
    name: string
    code?: string
  }
  onEdit?: () => void
  className?: string
}

const getUserDisplayName = (user: ProfileCardProps['user']) => {
  const firstName = user.firstName || user.first_name || ''
  const lastName = user.lastName || user.last_name || ''

  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim()
  }

  return user.email || 'Usuario'
}

const getUserInitials = (user: ProfileCardProps['user']) => {
  const firstName = user.firstName || user.first_name || ''
  const lastName = user.lastName || user.last_name || ''

  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return user.email?.charAt(0).toUpperCase() || 'U'
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  user,
  role,
  tenant,
  onEdit,
  className,
}) => {
  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(user)

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('w-full', className)}
    >
      <Card className="relative overflow-hidden border-0 shadow-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        {/* Gradiente superior */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />
        
        <CardHeader className="pb-4">
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Perfil Personal
              </h3>
            </div>
            
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2"
            >
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                En línea
              </span>
            </motion.div>
          </motion.div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            {/* Avatar mejorado */}
            <motion.div
              variants={itemVariants}
              className="relative group"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300" />
              <div className="relative bg-white dark:bg-gray-800 p-2 rounded-2xl">
                <Avatar className="h-32 w-32 ring-4 ring-blue-500/20">
                  <AvatarImage src={user.avatar} alt={displayName} />
                  <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                {/* Botón de cámara */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                  onClick={onEdit}
                >
                  <Camera className="h-4 w-4" />
                </motion.button>
              </div>
              
              {/* Badge de verificación */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -bottom-2 -right-2"
              >
                <div className="bg-white dark:bg-gray-800 p-1 rounded-full shadow-lg">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </motion.div>
            </motion.div>

            {/* Información del usuario */}
            <div className="flex-1 space-y-6">
              <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {displayName}
                </h2>
                
                <div className="flex items-center gap-3 text-lg text-gray-600 dark:text-gray-300">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>{user.email}</span>
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-4"
              >
                {role && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <Badge variant="secondary" className="text-sm font-medium px-4 py-2">
                      {role.name}
                    </Badge>
                  </div>
                )}

                {tenant && (
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Hospital className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-700/50 px-4 py-2 rounded-lg font-medium">
                      {tenant.name}
                      {tenant.code && ` (${tenant.code})`}
                    </span>
                  </div>
                )}

                {/* Indicador de experiencia */}
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="outline" className="text-sm font-medium px-4 py-2 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400">
                    Usuario Verificado
                  </Badge>
                </div>
              </motion.div>

              {/* Botón de editar perfil */}
              {onEdit && (
                <motion.div variants={itemVariants}>
                  <Button
                    onClick={onEdit}
                    className="flex items-center gap-3 px-6 py-3 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Edit3 className="h-5 w-5" />
                    Editar Perfil
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default ProfileCard