"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Plus, Minus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONDITIONS } from "@/lib/constants/conditions";

interface CardInfo {
  id: string;
  name: string;
  number: string;
  image_url: string | null;
  market_value: number | null;
  set_name: string;
}

interface AddCardModalProps {
  card: CardInfo | null;
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    card_id: string;
    variant: string;
    condition: string;
    is_graded: boolean;
    grading_company: string | null;
    grade: number | null;
    purchase_price: number | null;
    quantity: number;
  }) => Promise<void>;
}

const VARIANTS = ["Normal", "Holofoil", "Reverse Holofoil", "1st Edition", "Full Art"];
const GRADERS = ["Raw", "PSA", "BGS", "CGC", "SGC"];

export default function AddCardModal({ card, open, onClose, onAdd }: AddCardModalProps) {
  const [variant, setVariant] = useState("Normal");
  const [grader, setGrader] = useState("Raw");
  const [grade, setGrade] = useState(10);
  const [condition, setCondition] = useState("near_mint");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  if (!open || !card) return null;

  const isGraded = grader !== "Raw";

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAdd({
        card_id: card.id,
        variant,
        condition,
        is_graded: isGraded,
        grading_company: isGraded ? grader : null,
        grade: isGraded ? grade : null,
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        quantity,
      });
      // Reset form
      setVariant("Normal");
      setGrader("Raw");
      setGrade(10);
      setCondition("near_mint");
      setPurchasePrice("");
      setQuantity(1);
      onClose();
    } catch {
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold">Add to Collection</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Card Preview */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
            {card.image_url ? (
              <div className="h-20 w-14 relative rounded-lg overflow-hidden bg-gray-200 shrink-0">
                <Image src={card.image_url} alt={card.name} fill className="object-contain" sizes="56px" />
              </div>
            ) : (
              <div className="h-20 w-14 bg-gray-200 rounded-lg flex items-center justify-center shrink-0">
                <Wallet className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate">{card.name}</h3>
              <p className="text-xs text-gray-500">{card.set_name} · #{card.number}</p>
              {card.market_value != null && (
                <p className="text-sm font-medium text-green-600 mt-1">${card.market_value.toFixed(2)}</p>
              )}
            </div>
          </div>

          {/* Variant Selector */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Variant</label>
            <div className="flex flex-wrap gap-2">
              {VARIANTS.map((v) => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    variant === v
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Grader Selector */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Grading</label>
            <div className="flex flex-wrap gap-2">
              {GRADERS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGrader(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    grader === g
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Grade Input (if graded) */}
          {isGraded && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">
                Grade ({grader})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={grade}
                  onChange={(e) => setGrade(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-blue-600 w-10 text-center">{grade}</span>
              </div>
            </div>
          )}

          {/* Condition Selector (if raw) */}
          {!isGraded && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-2 block">Condition</label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCondition(c.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      condition === c.value
                        ? `${c.bgColor} ${c.color} ring-1 ring-current`
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {c.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Paid */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Price Paid (optional)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-xl font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(99, quantity + 1))}
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Add Button */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <Button
            onClick={handleAdd}
            disabled={adding}
            className="w-full h-12 text-base font-semibold gap-2"
          >
            <Plus className="h-5 w-5" />
            {adding ? "Adding..." : "Add to Collection"}
          </Button>
        </div>
      </div>
    </div>
  );
}
