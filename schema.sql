-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.avatar (
  user_id bigint NOT NULL,
  nickname text NOT NULL,
  sprite text,
  stats jsonb,
  achievements ARRAY,
  CONSTRAINT avatar_pkey PRIMARY KEY (user_id),
  CONSTRAINT avatar_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.booking (
  booking_id integer NOT NULL DEFAULT nextval('booking_booking_id_seq'::regclass),
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  pending boolean NOT NULL DEFAULT true,
  user_id bigint NOT NULL,
  desk_id integer,
  room_id integer,
  CONSTRAINT booking_pkey PRIMARY KEY (booking_id),
  CONSTRAINT booking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT booking_desk_id_fkey FOREIGN KEY (desk_id) REFERENCES public.desk(desk_id),
  CONSTRAINT booking_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.room(room_id)
);
CREATE TABLE public.desk (
  desk_id integer NOT NULL DEFAULT nextval('desk_desk_id_seq'::regclass),
  occupied boolean NOT NULL DEFAULT false,
  position_name text NOT NULL,
  CONSTRAINT desk_pkey PRIMARY KEY (desk_id)
);
CREATE TABLE public.invitation (
  booking_id integer NOT NULL,
  user_id bigint NOT NULL,
  CONSTRAINT invitation_pkey PRIMARY KEY (booking_id, user_id),
  CONSTRAINT invitation_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.booking(booking_id),
  CONSTRAINT invitation_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.managed_rooms (
  room_id integer NOT NULL,
  user_id bigint NOT NULL,
  CONSTRAINT managed_rooms_pkey PRIMARY KEY (room_id, user_id),
  CONSTRAINT managed_rooms_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.room(room_id),
  CONSTRAINT managed_rooms_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.managedroom (
  user_id integer NOT NULL,
  room_id integer NOT NULL,
  CONSTRAINT managedroom_pkey PRIMARY KEY (user_id, room_id),
  CONSTRAINT managedroom_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id),
  CONSTRAINT managedroom_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.room(room_id)
);
CREATE TABLE public.managedrooms (
  room_id integer NOT NULL,
  user_id integer NOT NULL,
  CONSTRAINT managedrooms_pkey PRIMARY KEY (room_id, user_id),
  CONSTRAINT managedrooms_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.room(room_id),
  CONSTRAINT managedrooms_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.room (
  room_id integer NOT NULL DEFAULT nextval('room_room_id_seq'::regclass),
  name text NOT NULL,
  capacity integer NOT NULL,
  occupied boolean NOT NULL DEFAULT false,
  type_id integer NOT NULL,
  CONSTRAINT room_pkey PRIMARY KEY (room_id),
  CONSTRAINT room_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.type(type_id)
);
CREATE TABLE public.type (
  type_id integer NOT NULL DEFAULT nextval('type_type_id_seq'::regclass),
  type_name text NOT NULL UNIQUE CHECK (type_name = ANY (ARRAY['office'::text, 'meeting'::text, 'training'::text, 'beer'::text, 'wellbeing'::text])),
  approval boolean NOT NULL DEFAULT false,
  CONSTRAINT type_pkey PRIMARY KEY (type_id)
);
CREATE TABLE public.users (
  user_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  hashed_password text NOT NULL,
  role text NOT NULL DEFAULT 'employee'::text CHECK (role = ANY (ARRAY['employee'::text, 'admin'::text])),
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);