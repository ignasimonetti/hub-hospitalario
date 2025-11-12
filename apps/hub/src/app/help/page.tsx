"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  Book,
  MessageCircle,
  Phone,
  Mail,
  FileText,
  Users,
  Shield,
  Zap,
  Heart,
  Stethoscope,
  Activity,
  AlertTriangle,
  CheckCircle,
  HelpCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Primeros Pasos',
      icon: Book,
      description: 'Guía básica para comenzar a usar el sistema',
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      items: [
        'Cómo iniciar sesión',
        'Configuración inicial del perfil',
        'Selección de hospital',
        'Navegación básica'
      ]
    },
    {
      id: 'user-management',
      title: 'Gestión de Usuarios',
      icon: Users,
      description: 'Administración de cuentas y permisos',
      color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      items: [
        'Cambiar contraseña',
        'Actualizar información personal',
        'Roles y permisos',
        'Configuración de preferencias'
      ]
    },
    {
      id: 'security',
      title: 'Seguridad',
      icon: Shield,
      description: 'Políticas de seguridad y mejores prácticas',
      color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      items: [
        'Políticas de contraseña',
        'Autenticación de dos factores',
        'Protección de datos médicos',
        'Reportar incidentes de seguridad'
      ]
    },
    {
      id: 'technical-support',
      title: 'Soporte Técnico',
      icon: Zap,
      description: 'Ayuda con problemas técnicos',
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
      items: [
        'Problemas de conexión',
        'Errores del sistema',
        'Compatibilidad de dispositivos',
        'Actualizaciones del sistema'
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Contactar Soporte',
      description: '¿Necesitas ayuda inmediata?',
      icon: MessageCircle,
      action: () => window.open('mailto:soporte@hospital.com', '_blank'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Llamar Helpdesk',
      description: 'Soporte telefónico 24/7',
      icon: Phone,
      action: () => window.open('tel:+5491123456789', '_blank'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Reportar Problema',
      description: 'Enviar reporte de bug',
      icon: AlertTriangle,
      action: () => window.open('mailto:bugs@hospital.com', '_blank'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const faqs = [
    {
      question: '¿Cómo cambio mi contraseña?',
      answer: 'Ve a tu perfil → Configuración → Cambiar Contraseña. Necesitarás tu contraseña actual.'
    },
    {
      question: '¿Qué hago si olvido mi contraseña?',
      answer: 'Usa la opción "Olvidé mi contraseña" en la pantalla de login. Recibirás un email con instrucciones.'
    },
    {
      question: '¿Cómo cambio entre modo claro y oscuro?',
      answer: 'Ve a tu perfil → Configuración → Preferencias → Tema de la aplicación.'
    },
    {
      question: '¿Cómo reporto un problema técnico?',
      answer: 'Usa el botón "Reportar Problema" en esta página o contacta al helpdesk.'
    },
    {
      question: '¿Los datos están seguros?',
      answer: 'Sí, cumplimos con todas las normativas de protección de datos médicos (HIPAA, LGPD, etc.).'
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Centro de Ayuda
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >

          {/* Welcome Section */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Heart className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ¿Cómo podemos ayudarte?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Encuentra respuestas rápidas o contacta a nuestro equipo de soporte especializado en salud.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar en preguntas frecuentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center" onClick={action.action}>
                  <div className={`inline-flex p-3 rounded-full ${action.color} text-white mb-4`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Help Categories */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Guías y Tutoriales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {helpCategories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className={`inline-flex p-2 rounded-lg ${category.color} mb-3`}>
                      <category.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {category.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.items.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Preguntas Frecuentes
            </h3>
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {faq.question}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ¿No encontraste lo que buscas?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Nuestro equipo de soporte especializado está aquí para ayudarte con cualquier consulta sobre el sistema hospitalario.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  soporte@hospital.com
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +54 9 11 2345-6789
                </Button>
              </div>
            </CardContent>
          </Card>

        </motion.div>
      </div>
    </div>
  );
}