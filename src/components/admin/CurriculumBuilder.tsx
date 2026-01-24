'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface Lesson {
  lessonId: string;
  title: string;
  duration: string;
  type: 'video' | 'article' | 'quiz';
}

interface Module {
  moduleId: string;
  moduleName: string;
  lessons: Lesson[];
}

interface CurriculumBuilderProps {
  value: Module[];
  onChange: (curriculum: Module[]) => void;
}

export function CurriculumBuilder({ value, onChange }: CurriculumBuilderProps) {
  const [modules, setModules] = useState<Module[]>(value || []);

  const addModule = () => {
    const newModule: Module = {
      moduleId: uuidv4(),
      moduleName: `Module ${modules.length + 1}`,
      lessons: [],
    };
    const updated = [...modules, newModule];
    setModules(updated);
    onChange(updated);
  };

  const updateModule = (moduleId: string, moduleName: string) => {
    const updated = modules.map(m =>
      m.moduleId === moduleId ? { ...m, moduleName } : m
    );
    setModules(updated);
    onChange(updated);
  };

  const deleteModule = (moduleId: string) => {
    const updated = modules.filter(m => m.moduleId !== moduleId);
    setModules(updated);
    onChange(updated);
  };

  const addLesson = (moduleId: string) => {
    const updated = modules.map(m => {
      if (m.moduleId === moduleId) {
        return {
          ...m,
          lessons: [
            ...m.lessons,
            {
              lessonId: uuidv4(),
              title: `Lesson ${m.lessons.length + 1}`,
              duration: '10 min',
              type: 'video',
            },
          ],
        };
      }
      return m;
    });
    setModules(updated);
    onChange(updated);
  };

  const updateLesson = (
    moduleId: string,
    lessonId: string,
    field: keyof Lesson,
    value: string
  ) => {
    const updated = modules.map(m => {
      if (m.moduleId === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l =>
            l.lessonId === lessonId ? { ...l, [field]: value } : l
          ),
        };
      }
      return m;
    });
    setModules(updated);
    onChange(updated);
  };

  const deleteLesson = (moduleId: string, lessonId: string) => {
    const updated = modules.map(m => {
      if (m.moduleId === moduleId) {
        return {
          ...m,
          lessons: m.lessons.filter(l => l.lessonId !== lessonId),
        };
      }
      return m;
    });
    setModules(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {modules.map((module) => (
        <Collapsible key={module.moduleId} defaultOpen>
          <div className="border rounded-lg">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-t-lg border-b">
                <div className="flex items-center gap-3 flex-1">
                  <ChevronDown className="h-5 w-5" />
                  <input
                    type="text"
                    value={module.moduleName}
                    onChange={(e) => updateModule(module.moduleId, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm font-medium border-0 bg-transparent outline-none flex-1 text-left"
                  />
                  <span className="text-xs text-gray-500">
                    {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="p-4 space-y-3 bg-gray-50">
                {module.lessons.map((lesson) => (
                  <div key={lesson.lessonId} className="flex gap-2 bg-white p-3 rounded border items-end">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-600">Title</label>
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) =>
                          updateLesson(
                            module.moduleId,
                            lesson.lessonId,
                            'title',
                            e.target.value
                          )
                        }
                        className="w-full border rounded px-2 py-1 text-sm mt-1"
                      />
                    </div>

                    <div className="w-24">
                      <label className="text-xs font-medium text-gray-600">Duration</label>
                      <input
                        type="text"
                        value={lesson.duration}
                        onChange={(e) =>
                          updateLesson(
                            module.moduleId,
                            lesson.lessonId,
                            'duration',
                            e.target.value
                          )
                        }
                        className="w-full border rounded px-2 py-1 text-sm mt-1"
                        placeholder="10 min"
                      />
                    </div>

                    <div className="w-28">
                      <label className="text-xs font-medium text-gray-600">Type</label>
                      <select
                        value={lesson.type}
                        onChange={(e) =>
                          updateLesson(
                            module.moduleId,
                            lesson.lessonId,
                            'type',
                            e.target.value
                          )
                        }
                        className="w-full border rounded px-2 py-1 text-sm mt-1"
                      >
                        <option value="video">Video</option>
                        <option value="article">Article</option>
                        <option value="quiz">Quiz</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        deleteLesson(module.moduleId, lesson.lessonId)
                      }
                      className="p-2 hover:bg-red-50 text-red-600 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addLesson(module.moduleId)}
                  className="w-full flex items-center justify-center gap-2 p-2 border border-dashed rounded text-sm text-gray-600 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                  Add Lesson
                </button>
              </div>
            </CollapsibleContent>

            <button
              type="button"
              onClick={() => deleteModule(module.moduleId)}
              className="w-full p-2 text-red-600 hover:bg-red-50 text-sm border-t flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Module
            </button>
          </div>
        </Collapsible>
      ))}

      <Button
        type="button"
        onClick={addModule}
        variant="outline"
        className="w-full gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Module
      </Button>
    </div>
  );
}
