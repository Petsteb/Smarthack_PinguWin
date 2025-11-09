-- Auto-generated SQL to populate spaces from floor_data.json
-- This script ensures each space gets exactly one database entry
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Insert room types
-- ============================================================================

INSERT INTO public.type (type_name, approval)
VALUES
    ('office', false),
    ('meeting', true),
    ('training', true),
    ('beer', false),
    ('wellbeing', false)
ON CONFLICT (type_name) DO NOTHING;

-- ============================================================================
-- STEP 2: Insert desks and rooms
-- ============================================================================


-- Desk 0
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-0', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 1
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-1', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 2
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-2', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 3
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-3', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 4
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-4', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 5
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-5', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 6
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-6', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 7
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-7', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 8
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-8', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 9
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-9', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 10
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-10', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 11
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-11', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 12
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-12', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 13
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-13', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 14
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-14', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 15
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-15', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 16
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-16', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 17
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-17', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 18
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-18', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 19
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-19', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 20
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-20', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 21
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-21', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 22
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-22', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 23
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-23', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 24
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-24', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 25
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-25', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 26
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-26', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 27
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-27', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 28
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-28', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 29
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-29', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 30
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-30', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 31
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-31', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 32
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-32', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 33
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-33', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 34
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-34', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 35
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-35', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 36
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-36', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 37
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-37', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 38
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-38', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 39
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-39', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 40
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-40', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 41
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-41', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 42
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-42', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 43
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-43', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 44
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-44', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 45
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-45', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 46
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-46', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 47
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-47', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 48
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-48', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 49
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-49', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 50
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-50', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 51
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-51', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 52
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-52', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 53
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-53', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 54
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-54', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 55
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-55', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 56
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-56', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 57
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-57', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 58
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-58', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 59
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-59', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 60
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-60', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 61
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-61', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 62
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-62', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 63
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-63', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 64
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-64', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 65
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-65', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 66
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-66', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 67
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-67', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 68
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-68', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 69
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-69', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 70
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-70', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 71
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-71', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 72
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-72', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 73
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-73', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 74
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-74', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 75
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-75', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 76
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-76', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 77
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-77', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 78
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-78', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 79
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-79', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 80
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-80', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 81
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-81', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 82
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-82', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 83
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-83', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 84
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-84', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 85
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-85', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 86
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-86', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 87
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-87', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 88
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-88', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 89
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-89', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 90
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-90', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 91
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-91', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 92
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-92', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 93
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-93', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 94
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-94', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 95
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-95', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 96
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-96', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 97
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-97', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 98
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-98', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 99
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-99', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 100
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-100', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 101
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-101', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 102
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-102', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 103
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-103', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 104
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-104', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 105
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-105', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 106
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-106', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 107
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-107', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 108
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-108', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 109
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-109', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 110
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-110', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 111
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-111', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 112
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-112', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 113
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-113', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 114
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-114', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 115
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-115', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 116
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-116', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 117
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-117', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 118
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-118', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 119
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-119', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 120
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-120', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 121
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-121', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 122
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-122', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 123
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-123', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 124
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-124', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 125
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-125', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 126
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-126', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 127
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-127', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 128
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-128', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 129
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-129', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 130
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-130', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 131
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-131', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 132
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-132', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 133
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-133', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 134
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-134', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 135
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-135', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 136
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-136', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 137
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-137', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 138
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-138', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 139
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-139', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 140
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-140', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 141
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-141', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 142
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-142', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 143
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-143', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 144
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-144', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 145
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-145', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 146
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-146', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 147
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-147', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 148
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-148', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 149
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-149', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 150
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-150', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 151
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-151', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 152
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-152', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 153
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-153', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 154
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-154', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 155
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-155', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 156
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-156', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 157
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-157', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 158
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-158', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 159
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-159', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 160
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-160', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 161
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-161', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 162
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-162', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 163
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-163', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 164
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-164', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 165
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-165', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 166
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-166', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 167
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-167', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 168
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-168', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 169
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-169', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 170
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-170', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 171
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-171', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 172
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-172', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 173
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-173', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 174
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-174', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 175
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-175', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 176
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-176', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 177
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-177', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 178
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-178', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 179
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-179', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 180
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-180', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 181
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-181', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 182
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-182', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 183
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-183', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 184
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-184', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 185
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-185', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 186
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-186', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 187
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-187', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 188
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-188', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 189
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-189', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 190
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-190', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Desk 191
INSERT INTO public.desk (position_name, occupied)
VALUES ('desk-191', false)
ON CONFLICT (desk_id) DO NOTHING;


-- Room: beerPoint-0
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('beerPoint-0', 56, false, (SELECT type_id FROM public.type WHERE type_name = 'beer'))
ON CONFLICT DO NOTHING;


-- Room: beerPoint-1
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('beerPoint-1', 56, false, (SELECT type_id FROM public.type WHERE type_name = 'beer'))
ON CONFLICT DO NOTHING;


-- Room: beerPoint-2
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('beerPoint-2', 56, false, (SELECT type_id FROM public.type WHERE type_name = 'beer'))
ON CONFLICT DO NOTHING;


-- Room: beerPoint-3
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('beerPoint-3', 56, false, (SELECT type_id FROM public.type WHERE type_name = 'beer'))
ON CONFLICT DO NOTHING;


-- Room: billiard-0
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('billiard-0', 6, false, (SELECT type_id FROM public.type WHERE type_name = 'beer'))
ON CONFLICT DO NOTHING;


-- Room: billiard-1
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('billiard-1', 6, false, (SELECT type_id FROM public.type WHERE type_name = 'beer'))
ON CONFLICT DO NOTHING;


-- Room: managementRoom-0
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('managementRoom-0', 3, false, (SELECT type_id FROM public.type WHERE type_name = 'office'))
ON CONFLICT DO NOTHING;


-- Room: managementRoom-1
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('managementRoom-1', 3, false, (SELECT type_id FROM public.type WHERE type_name = 'office'))
ON CONFLICT DO NOTHING;


-- Room: managementRoom-2
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('managementRoom-2', 3, false, (SELECT type_id FROM public.type WHERE type_name = 'office'))
ON CONFLICT DO NOTHING;


-- Room: wellbeing
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('wellbeing', 6, false, (SELECT type_id FROM public.type WHERE type_name = 'wellbeing'))
ON CONFLICT DO NOTHING;


-- Room: teamMeetings-small-0
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('teamMeetings-small-0', 4, false, (SELECT type_id FROM public.type WHERE type_name = 'meeting'))
ON CONFLICT DO NOTHING;


-- Room: teamMeetings-small-1
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('teamMeetings-small-1', 4, false, (SELECT type_id FROM public.type WHERE type_name = 'meeting'))
ON CONFLICT DO NOTHING;


-- Room: teamMeetings-small-2
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('teamMeetings-small-2', 4, false, (SELECT type_id FROM public.type WHERE type_name = 'meeting'))
ON CONFLICT DO NOTHING;


-- Room: teamMeetings-small-3
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('teamMeetings-small-3', 4, false, (SELECT type_id FROM public.type WHERE type_name = 'meeting'))
ON CONFLICT DO NOTHING;


-- Room: teamMeetings-round4-0
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('teamMeetings-round4-0', 4, false, (SELECT type_id FROM public.type WHERE type_name = 'meeting'))
ON CONFLICT DO NOTHING;


-- Room: teamMeetings-square4-0
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('teamMeetings-square4-0', 20, false, (SELECT type_id FROM public.type WHERE type_name = 'meeting'))
ON CONFLICT DO NOTHING;


-- Room: teamMeetings-square4-1
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('teamMeetings-square4-1', 20, false, (SELECT type_id FROM public.type WHERE type_name = 'meeting'))
ON CONFLICT DO NOTHING;


-- Room: teamMeetings-square4-2
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('teamMeetings-square4-2', 20, false, (SELECT type_id FROM public.type WHERE type_name = 'meeting'))
ON CONFLICT DO NOTHING;


-- Room: teamMeetings-square4-3
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('teamMeetings-square4-3', 20, false, (SELECT type_id FROM public.type WHERE type_name = 'meeting'))
ON CONFLICT DO NOTHING;


-- Room: teamMeetings-square4-4
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('teamMeetings-square4-4', 20, false, (SELECT type_id FROM public.type WHERE type_name = 'meeting'))
ON CONFLICT DO NOTHING;


-- Room: trainingRoom1
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('trainingRoom1', 18, false, (SELECT type_id FROM public.type WHERE type_name = 'training'))
ON CONFLICT DO NOTHING;


-- Room: trainingRoom2
INSERT INTO public.room (name, capacity, occupied, type_id)
VALUES ('trainingRoom2', 19, false, (SELECT type_id FROM public.type WHERE type_name = 'training'))
ON CONFLICT DO NOTHING;


-- ============================================================================
-- STEP 3: Verification
-- ============================================================================

-- Expected counts:
-- Desks: 192
-- Rooms: 22

SELECT 'Desks' as resource_type, COUNT(*) as count FROM public.desk
UNION ALL
SELECT 'Rooms' as resource_type, COUNT(*) as count FROM public.room
UNION ALL
SELECT 'Types' as resource_type, COUNT(*) as count FROM public.type;

-- List all rooms by type
SELECT t.type_name, COUNT(r.room_id) as room_count
FROM public.type t
LEFT JOIN public.room r ON t.type_id = r.type_id
GROUP BY t.type_name
ORDER BY t.type_name;

-- Success! Database is ready for bookings.
