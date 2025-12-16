"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  HelpCircle,
  LayoutDashboard,
  Newspaper,
  FolderOpen,
  Bell
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function HelpPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const modules = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Panel principal con métricas y accesos rápidos.',
      color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      features: [
        'Vista general de estadísticas',
        'Accesos directos a módulos',
        'Notificaciones recientes',
        'Notas personales'
      ]
    },
    {
      id: 'blog',
      title: 'Noticias / Blog',
      icon: Newspaper,
      description: 'Sistema de comunicación institucional y novedades.',
      color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
      features: [
        'Lectura de comunicados oficiales',
        'Creación de artículos (Editores)',
        'Suscripción a categorías',
        'Archivo de noticias'
      ]
    },
    {
      id: 'expedientes',
      title: 'Expedientes',
      icon: FolderOpen,
      description: 'Seguimiento y gestión de trámites administrativos.',
      color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
      features: [
        'Búsqueda de expedientes',
        'Seguimiento de estado (En trámite/Finalizado)',
        'Consulta de movimientos',
        'Gestión de Mesa de Entrada'
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Contactar Soporte',
      description: 'Envíanos un correo electrónico',
      icon: Mail,
      action: () => window.open('mailto:info@cisb.gob.ar', '_blank'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Llamar al Centro',
      description: 'Atención telefónica',
      icon: Phone,
      action: () => window.open('tel:03854254480', '_blank'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Reportar Problema',
      description: 'Notificar un error del sistema',
      icon: AlertTriangle,
      action: () => setIsReportModalOpen(true),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const faqs = [
    {
      question: '¿Cómo solicito acceso a un nuevo módulo?',
      answer: 'Debes contactar a tu superior inmediato o al departamento de sistemas para solicitar la ampliación de permisos en tu perfil.'
    },
    {
      question: '¿Qué hago si olvidé mi contraseña?',
      answer: 'Si no puedes ingresar, utiliza la opción "Olvidé mi contraseña" en la pantalla de inicio o contacta al administrador del sistema.'
    },
    {
      question: '¿Cómo veo mis notificaciones?',
      answer: 'Las notificaciones aparecen en el ícono de campana en la parte superior derecha de tu pantalla. Un punto rojo indica novedades sin leer.'
    },
    {
      question: '¿Puedo acceder al sistema desde mi celular?',
      answer: 'Sí, el Hub Hospitalario es completamente responsivo y puede utilizarse desde el navegador de cualquier dispositivo móvil.'
    }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
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
                Volver
              </Button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Ayuda y Soporte
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-2">
            <Stethoscope className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Centro de Ayuda CISB
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Bienvenido al Hub Hospitalario del Centro Integral de Salud Banda. Aquí encontrarás guías y recursos para utilizar el sistema eficientemente.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar ayuda..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800"
              />
            </div>
          </div>
        </motion.div>

        {/* Modules Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Book className="h-5 w-5 text-blue-500" />
            Módulos del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modules.map((module) => (
              <Card key={module.id} className="hover:shadow-lg transition-all duration-200 border-t-4" style={{ borderTopColor: module.color.includes('blue') ? '#3b82f6' : module.color.includes('purple') ? '#a855f7' : '#f97316' }}>
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${module.color} mb-2`}>
                    <module.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 min-h-[40px]">
                    {module.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {module.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Future: Add 'Ver Manual' button here */}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            Preguntas Frecuentes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFAQs.map((faq, index) => (
              <Card key={index} className="border-l-4 border-l-gray-200 dark:border-l-gray-700">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Logic */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 md:p-12 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Heart className="w-64 h-64" />
          </div>

          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">¿Necesitas asistencia directa?</h3>
              <p className="text-slate-300 mb-8 max-w-md">
                Si tienes problemas técnicos o dudas administrativas que no se resuelven con esta guía, estamos disponibles para ayudarte.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Dirección</p>
                    <p className="font-medium">San Martín N° 449, La Banda</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <Phone className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Teléfono</p>
                    <p className="font-medium">0385-425-4480</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="font-medium">info@cisb.gob.ar</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-xl flex items-center gap-4 text-left group"
                >
                  <div className={`p-3 rounded-full ${action.color} text-white shadow-lg`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold group-hover:text-blue-300 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-sm text-slate-400">
                      {action.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Issue Modal */}
        <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
          <DialogContent className="sm:max-w-md dark:bg-slate-900 border-gray-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 dark:text-white">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Reportar un Problema
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400 pt-2">
                Para reportar un error o sugerir una mejora, por favor utiliza la herramienta de notificaciones integrada en el sistema.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full">
                <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p>
                  1. Busca el ícono de la <strong>campana</strong> en la esquina superior derecha de tu pantalla.
                </p>
                <p>
                  2. Haz clic en él y selecciona la opción <strong>"Reportar problema"</strong>.
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-300 w-full">
                Esto nos permite capturar automáticamente información técnica útil para resolver tu inconveniente más rápido.
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="default"
                onClick={() => setIsReportModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Entendido
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}