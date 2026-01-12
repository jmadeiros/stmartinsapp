"use client"

import { useState } from "react"
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  MoreHorizontal, 
  Calendar, 
  Users, 
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  CircleDashed,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock Data
const MOCK_PROJECTS = [
  {
    id: 1,
    title: "Website Redesign 2024",
    description: "Revamping the main parish website with new branding and improved navigation structure for better user experience.",
    status: "in_progress",
    priority: "high",
    progress: 65,
    dueDate: "2024-03-15",
    members: [
      { id: 1, name: "Sarah", image: "https://i.pravatar.cc/150?u=1" },
      { id: 2, name: "Mike", image: "https://i.pravatar.cc/150?u=2" },
      { id: 3, name: "Jessica", image: "https://i.pravatar.cc/150?u=3" },
    ],
    category: "Digital",
    updatedAt: "2 hours ago"
  },
  {
    id: 2,
    title: "Community Garden Initiative",
    description: "Planning and organizing the spring planting schedule for the community garden, including volunteer coordination.",
    status: "planning",
    priority: "medium",
    progress: 25,
    dueDate: "2024-04-01",
    members: [
      { id: 4, name: "David", image: "https://i.pravatar.cc/150?u=4" },
      { id: 5, name: "Emma", image: "https://i.pravatar.cc/150?u=5" },
    ],
    category: "Community",
    updatedAt: "1 day ago"
  },
  {
    id: 3,
    title: "Fall Festival Organization",
    description: "Coordinating vendors, entertainment, and logistics for the annual fall festival event.",
    status: "completed",
    priority: "low",
    progress: 100,
    dueDate: "2023-11-20",
    members: [
      { id: 1, name: "Sarah", image: "https://i.pravatar.cc/150?u=1" },
      { id: 4, name: "David", image: "https://i.pravatar.cc/150?u=4" },
      { id: 6, name: "Tom", image: "https://i.pravatar.cc/150?u=6" },
      { id: 7, name: "Lisa", image: "https://i.pravatar.cc/150?u=7" },
    ],
    category: "Events",
    updatedAt: "1 month ago"
  },
  {
    id: 4,
    title: "Youth Ministry Curriculum",
    description: "Developing new educational materials and activities for the upcoming youth ministry semester.",
    status: "in_progress",
    priority: "high",
    progress: 40,
    dueDate: "2024-02-28",
    members: [
      { id: 2, name: "Mike", image: "https://i.pravatar.cc/150?u=2" },
    ],
    category: "Education",
    updatedAt: "3 days ago"
  },
  {
    id: 5,
    title: "Outreach Program Expansion",
    description: "Scaling our food bank operations to serve 3 new neighborhoods in the district.",
    status: "planning",
    priority: "high",
    progress: 10,
    dueDate: "2024-05-10",
    members: [
      { id: 3, name: "Jessica", image: "https://i.pravatar.cc/150?u=3" },
      { id: 5, name: "Emma", image: "https://i.pravatar.cc/150?u=5" },
      { id: 7, name: "Lisa", image: "https://i.pravatar.cc/150?u=7" },
    ],
    category: "Outreach",
    updatedAt: "5 hours ago"
  },
  {
    id: 6,
    title: "Quarterly Financial Report",
    description: "Compiling financial statements and budget analysis for Q1 board meeting.",
    status: "review",
    priority: "medium",
    progress: 90,
    dueDate: "2024-01-30",
    members: [
      { id: 6, name: "Tom", image: "https://i.pravatar.cc/150?u=6" },
    ],
    category: "Admin",
    updatedAt: "12 hours ago"
  }
]

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [statusFilter, setStatusFilter] = useState("all")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200"
      case "in_progress": return "bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200"
      case "planning": return "bg-purple-100 text-purple-700 hover:bg-purple-100/80 border-purple-200"
      case "review": return "bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200"
      default: return "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 border-red-100"
      case "medium": return "text-amber-600 bg-amber-50 border-amber-100"
      case "low": return "text-blue-600 bg-blue-50 border-blue-100"
      default: return "text-gray-600 bg-gray-50 border-gray-100"
    }
  }

  const filteredProjects = statusFilter === "all" 
    ? MOCK_PROJECTS 
    : MOCK_PROJECTS.filter(p => p.status === statusFilter)

  // Stats
  const activeCount = MOCK_PROJECTS.filter(p => ["in_progress", "planning", "review"].includes(p.status)).length
  const completedCount = MOCK_PROJECTS.filter(p => p.status === "completed").length
  const highPriorityCount = MOCK_PROJECTS.filter(p => p.priority === "high").length

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Header Section */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Projects</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage and track your team&apos;s initiatives</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <h3 className="text-2xl font-bold mt-1">{activeCount}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <CircleDashed className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <h3 className="text-2xl font-bold mt-1">{completedCount}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                  <h3 className="text-2xl font-bold mt-1">{highPriorityCount}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search projects..." 
                className="pl-9 bg-white"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Filter by Member</DropdownMenuItem>
                <DropdownMenuItem>Filter by Date</DropdownMenuItem>
                <DropdownMenuItem>Filter by Priority</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <Tabs defaultValue="all" className="w-[400px]" onValueChange={setStatusFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="in_progress">Active</TabsTrigger>
                <TabsTrigger value="completed">Done</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center border rounded-md bg-white">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-9 w-9 rounded-none rounded-l-md"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <div className="w-[1px] h-4 bg-border" />
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-9 w-9 rounded-none rounded-r-md"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="group hover:shadow-md transition-all duration-200 border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getStatusColor(project.status)} border px-2 py-0.5`}>
                          {getStatusLabel(project.status)}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Project</DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg font-semibold mt-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {project.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-4">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <Clock className="h-4 w-4" />
                         <span>{project.updatedAt}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t bg-gray-50/50 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {project.members.map((member) => (
                      <Avatar key={member.id} className="h-7 w-7 border-2 border-white ring-1 ring-gray-100">
                        <AvatarImage src={member.image} alt={member.name} />
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.members.length > 3 && (
                      <div className="h-7 w-7 rounded-full bg-gray-100 border-2 border-white ring-1 ring-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-600">
                        +2
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs hover:bg-white hover:shadow-sm">
                    View Project
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-4">Project Name</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Progress</div>
              <div className="col-span-2">Team</div>
              <div className="col-span-2 text-right">Due Date</div>
            </div>
            <div className="divide-y">
              {filteredProjects.map((project) => (
                <div key={project.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors group">
                  <div className="col-span-4 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 truncate">{project.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{project.category}</p>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className={`${getStatusColor(project.status)} border px-2 py-0.5 text-xs`}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                     <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-1.5 w-16" />
                        <span className="text-xs text-muted-foreground">{project.progress}%</span>
                     </div>
                  </div>
                  <div className="col-span-2">
                    <div className="flex -space-x-2">
                      {project.members.slice(0, 3).map((member) => (
                        <Avatar key={member.id} className="h-6 w-6 border-2 border-white">
                          <AvatarImage src={member.image} />
                          <AvatarFallback className="text-[9px]">{member.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-sm text-muted-foreground">
                    {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
