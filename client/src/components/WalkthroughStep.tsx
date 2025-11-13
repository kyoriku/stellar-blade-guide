import { type WalkthroughStep as WalkthroughStepType } from '../services/api'
import { Lightbulb, AlertTriangle, Package } from 'lucide-react'

interface WalkthroughStepProps {
  step: WalkthroughStepType;
}

function WalkthroughStep({ step }: WalkthroughStepProps) {
  return (
    <article className="group relative bg-secondary rounded-lg p-3 md:p-6 border border-gray-800 hover:border-gray-700 transition-all duration-300">
      <div className="relative">
        {/* Step Number and Instruction - matches collectible header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center font-bold text-blue-400 border border-blue-500/30">
            {step.step_number}
          </div>
          <p className="text-gray-200 leading-relaxed flex-1 pt-1">
            {step.instruction}
          </p>
        </div>

        {/* Combat Info - matches description style */}
        {step.combat_info && (
          <div className="mb-5">
            <div className="p-4 bg-tertiary rounded-lg border border-gray-700/50">
              <div className="space-y-2">
                {step.combat_info.enemies && (
                  <div className="flex gap-2">
                    <span className="text-gray-400">Enemies:</span>
                    <span className="text-gray-200">{step.combat_info.enemies.join(', ')}</span>
                  </div>
                )}
                
                {/* {step.combat_info.recommended_level && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 min-w-[100px]">Level:</span>
                    <span className="text-gray-200">{step.combat_info.recommended_level}</span>
                  </div>
                )} */}

                {/* {step.combat_info.balance_diamonds && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 min-w-[100px]">Balance:</span>
                    <span className="text-gray-200">{step.combat_info.balance_diamonds} diamonds</span>
                  </div>
                )} */}

                {step.combat_info.strategy && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <p className="text-gray-300">{step.combat_info.strategy}</p>
                  </div>
                )}

                {step.combat_info.key_attacks && step.combat_info.key_attacks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <p className="text-gray-400 mb-2">Key Attacks:</p>
                    <ul className="space-y-1.5">
                      {step.combat_info.key_attacks.map((attack, idx) => (
                        <li key={idx} className="flex gap-2 text-gray-300">
                          <span className="text-blue-400 font-bold">•</span>
                          <span className="flex-1">{attack}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {step.combat_info.key_mechanics && step.combat_info.key_mechanics.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <p className="text-gray-400 mb-2">Mechanics:</p>
                    <ul className="space-y-1.5">
                      {step.combat_info.key_mechanics.map((mechanic, idx) => (
                        <li key={idx} className="flex gap-2 text-gray-300">
                          <span className="text-blue-400 font-bold">•</span>
                          <span className="flex-1">{mechanic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes - matches description style with icon */}
        {step.notes && step.notes.length > 0 && (
          <div className="space-y-3  mb-5">
            {step.notes.map((note, idx) => (
              <div key={idx} className="flex gap-3">
                {note.type === 'tip' && <Lightbulb className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />}
                {note.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />}
                {note.type === 'collectible_reference' && <Package className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />}
                <p className="flex-1 text-gray-300 leading-relaxed">{note.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Images - same as ImageGallery */}
        {step.images && step.images.length > 0 && (
          <div className={` grid gap-3 ${step.images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {step.images.map((image, idx) => (
              <div key={idx} className="aspect-video overflow-hidden rounded-lg">
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default WalkthroughStep;