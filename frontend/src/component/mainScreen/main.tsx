"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Pen, PenSquare, Search, Sparkles, X } from 'lucide-react'

export default function Main() {
    const [isSearchVisible, setIsSearchVisible] = useState(false)
    const [searchText, setSearchText] = useState("")
    const searchInputRef = useRef<HTMLInputElement>(null)

    const onSearchClick = () => {
        setIsSearchVisible(!isSearchVisible)
    }

    // Focus search input when search is visible
    useEffect(() => {
        if (isSearchVisible && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [isSearchVisible])

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(e.target.value)
    }

    // Handle search submission
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Add search implementation here
        console.log("Searching for:", searchText)
    }

    // Handle escape key to close search
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsSearchVisible(false)
            setSearchText("")
        }
    }

    return (
        <div className='flex flex-row items-center justify-between w-full h-16 p-4 bg-white border-b shadow-sm'>
            {isSearchVisible ? (
                <form onSubmit={handleSearchSubmit} className='flex flex-row items-center justify-between w-full h-full'>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchText}
                        onChange={handleSearchChange}
                        onKeyDown={handleKeyDown}
                        placeholder='Search...'
                        aria-label="Search"
                        className='w-full p-2 outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors'
                    />
                    <button 
                        type="button"
                        onClick={() => {
                            setIsSearchVisible(false)
                            setSearchText("")
                        }}
                        aria-label="Close search"
                        className='p-2 ml-2 rounded-full hover:bg-gray-100 transition-colors'
                    >
                        <X size={20} />
                    </button>
                </form>
            ) : (
                <>
                    <div className='flex flex-row items-center gap-6 justify-between'>
                        <div className='flex flex-row items-center justify-between gap-2'>
                            <span className='font-medium text-gray-800'>Important</span>
                            <span className='px-2 py-0.5 bg-blue-100 text-blue-800 text-sm rounded-full'>23</span>
                        </div>
                        <div className='flex flex-row items-center justify-between gap-2'>
                            <span className='font-medium text-gray-800'>Other</span>
                            <span className='px-2 py-0.5 bg-gray-100 text-gray-800 text-sm rounded-full'>22</span>
                        </div>
                    </div>

                    <div className='flex flex-row items-center justify-between gap-3'>
                        <button 
                            aria-label="New entry"
                            className='p-2 rounded-full hover:bg-gray-100 transition-colors'
                        >
                            <Pen size={20} />
                        </button>
                        <button 
                            onClick={onSearchClick}
                            aria-label="Search"
                            className='p-2 rounded-full hover:bg-gray-100 transition-colors'
                        >
                            <Search size={20} />
                        </button>
                        <button 
                            aria-label="AI suggestions"
                            className='p-2 rounded-full hover:bg-gray-100 transition-colors'
                        >
                            <Sparkles size={20} />
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
